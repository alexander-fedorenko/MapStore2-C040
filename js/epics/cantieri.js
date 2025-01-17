/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import Rx  from 'rxjs';
import {CLICK_ON_MAP}  from '@mapstore/actions/map';
import requestBuilder  from '@mapstore/utils/ogc/WFS/RequestBuilder';
import transactionRequestBuilder  from '@mapstore/utils/ogc/WFST/RequestBuilder';
const {filter, and, property} = requestBuilder({wfsVersion: "1.1.0"});
import {featureToRow, isSameFeature, checkFeature, uncheckFeature, getAreaFilter, isActiveTool,
    removeFeature, clearAllFeatures, getAreasLayer, getElementsLayer, getAreasGeometry,
    addFeaturesToElementLayer, showQueryElementsError, getElementsFilter, addFeatureToAreaLayer,
    replaceFeatures, getCheckedElementsFromLayer, getSmallestFeature, showTimeoutError
}  from '../utils/CantieriUtils';
import axios  from '@mapstore/libs/ajax';
import {addLayer, changeLayerProperties}  from '@mapstore/actions/layers';
import {changeDrawingStatus, END_DRAWING}  from '@mapstore/actions/draw';

import {reprojectGeoJson}  from '@mapstore/utils/CoordinatesUtils';
import {
    UPDATE_CHECKED_ELEMENTS, REMOVE_CANTIERI_AREA, RESET_CANTIERI_FEATURES,
    QUERY_ELEMENTS_FEATURES, ELEMENTS_LAYER, AREAS_LAYER, ROWS_SELECTED, ROWS_DESELECTED, SAVE_CANTIERI_DATA,
    dataSaved, queryElements, savingData, loadingData, updateCheckedElements
}  from '../actions/cantieri';

import {
    errorSavingData, successSavingData, errorSavingElements, infoNoFeaturesSelected, infoElementAlreadyPresent,
    errorRemoveFeature, errorResetCantieriFeatures, errorDrawingAreas, errorLoadCantieriAreas
}  from '../actions/notifications';

import { MAP_CONFIG_LOADED }  from '@mapstore/actions/config';
import { changeMousePositionState }  from '@mapstore/actions/mousePosition';
import {serviceRESTUrlSelector}  from '../selector/cantieri';

import * as FilterUtils  from '@mapstore/utils/FilterUtils';
import {transaction, describeFeatureType}  from '../api/WFST';
import assign  from 'object-assign';

const getWFSFeature = (searchUrl, filterObj) => {
    const data = FilterUtils.getWFSFilterData(filterObj);
    return Rx.Observable.defer( () =>
        axios.post(searchUrl + '?service=WFS&outputFormat=json&request=getFeature', data, {
            timeout: 10000,
            headers: {'Accept': 'application/json', 'Content-Type': 'application/xml'}
        }));
};

const prepareDataToSave = (elements, id) => {
    return assign({}, {
        "ELEMENTS": elements,
        "ID_CANTIERE": id
    });
};
const getLayer = (props) => {
    return {
        "group": props.group,
        "name": props.name,
        "id": props.id,
        "title": props.title,
        "type": "vector",
        "features": props.features,
        "visibility": true,
        "crs": props.projection,
        "featuresCrs": props.projection,
        "style": props.style
    };
};
import urlUtil  from 'url';

const getRestUrl = (url, type, idCantiere) => {
    const parsed = urlUtil.parse(url, true);
    return urlUtil.format(assign({}, parsed, {
        query: assign({}, parsed.query, type === "get" ? {"id_cantiere": idCantiere} : {})
    }));
};

const areaStyle = {
    color: "blue",
    weight: 3,
    fillColor: "#000000",
    fillOpacity: 0
};
let areaCount = 0;
const getSpatialFilter = (geometry, options, operation = "INTERSECTS") => {
    return {
        spatialField: {
            operation: operation,
            attribute: "GEOMETRY",
            geometry
        },
        "filterType": "OGC",
        "ogcVersion": "1.1.0",
        ...options
    };
};

const createAndAddLayers = (areasFeatures, store, checkedElementsFeatures) => {
    let actions = [];
    const cantieriState = store.getState().cantieri;
    let areaOptions = {
        features: areasFeatures.map(f => ({...f, style: areaStyle })),
        group: "Cantiere",
        title: "Aree",
        id: AREAS_LAYER,
        name: cantieriState && cantieriState.areasLayerName,
        style: null,
        projection: store.getState().map.present.projection
    };
    let elementiOptions = {
        features: checkedElementsFeatures,
        group: "Cantiere",
        title: "Elementi Selezionati",
        id: ELEMENTS_LAYER,
        name: "cantiere_elements",
        style: null,
        projection: store.getState().map.present.projection
    };
    actions.push(addLayer(getLayer(elementiOptions)));
    actions.push(addLayer(getLayer(areaOptions)));

    // updates draw support interaction
    actions.push(changeDrawingStatus("cleanAndContinueDrawing", "", "LavoriPubblici", [], {}));
    return Rx.Observable.from(actions);
};


export const initLavoriPubbliciPlugin = ( action$, store ) =>
    action$.ofType(MAP_CONFIG_LOADED)
    // .filter(() => routingSelector(store.getState()).indexOf("llpp") !== -1)
        .switchMap( () => {
            const cantieriState = store.getState().cantieri;
            return Rx.Observable.fromPromise(axios.get(getRestUrl(serviceRESTUrlSelector(store.getState()), "get", cantieriState.id), null, {
                timeout: 60000,
                headers: {'Accept': 'application/json', 'Content-Type': 'application/json'}
            }).then(r => {
                return r && r.data && r.data.ELEMENTS && r.data.ELEMENTS.length ? r.data.ELEMENTS : [];
            }))
                .switchMap((elements) => {
                    return Rx.Observable.of(
                        updateCheckedElements(elements)
                    );
                });
        }).catch( () => {
            return Rx.Observable.of(
                updateCheckedElements([]), changeMousePositionState(false));
        });
export const updateCantieriByClick = ( action$, store ) =>
    action$.ofType(CLICK_ON_MAP)
        .filter(() => isActiveTool("pointSelection", store))
        .switchMap( (action) => {
            const geometry = {
                type: "Point",
                coordinates: [action.point.latlng.lng, action.point.latlng.lat]
            };
            const cantieriState = store.getState().cantieri;
            return getWFSFeature(cantieriState.geoserverUrl, getSpatialFilter(geometry, {
                "featureTypeName": cantieriState.elementsLayerName}))
                .switchMap((response) => {
                    if (response.data && response.data.features) {
                        const elementsLayer = getElementsLayer(store);
                        const areasLayer = getAreasLayer(store);
                        // get only new features
                        let featureByClick = response.data.features
                            .filter(f => elementsLayer.features.findIndex(f2 => isSameFeature(f, f2)) < 0);
                        if (elementsLayer !== undefined && areasLayer !== undefined && featureByClick.length > 0) {
                            featureByClick = getSmallestFeature(featureByClick);
                            featureByClick = reprojectGeoJson(featureByClick, "EPSG:4326", store.getState().map.present.projection);
                            let elementsFeatures = elementsLayer.features.filter(f => f.id !== featureByClick.id);
                            let areasFeatureByClick = assign({}, featureByClick, {
                                properties: {
                                    "ID_ELEMENTO": areaCount++,
                                    "ID_CANTIERE": cantieriState.id,
                                    "TIPOLOGIA": cantieriState.typology
                                },
                                geometry: {
                                    // needed for converting polygons to multipolygons
                                    type: featureByClick.geometry.type === "Polygon" ? "MultiPolygon" : "MultiPolygon",
                                    coordinates: featureByClick.geometry.type === "Polygon" ? [featureByClick.geometry.coordinates] : featureByClick.geometry.coordinates
                                }
                            });
                            return replaceFeatures(elementsFeatures.concat(
                                [featureByClick].map(checkFeature)
                            ), elementsLayer)
                                .concat( addFeatureToAreaLayer(areasFeatureByClick, areasLayer) );
                        }
                        if (elementsLayer !== undefined && response.data.features.length === 0) {
                            return Rx.Observable.of(infoNoFeaturesSelected());
                        }
                        // toggle style for selected features
                        if (elementsLayer !== undefined && featureByClick.length === 0) {
                            featureByClick = getSmallestFeature(response.data.features);
                            featureByClick = reprojectGeoJson(featureByClick, "EPSG:4326", store.getState().map.present.projection);
                            let correspondingFeature = elementsLayer.features.filter(f => isSameFeature(f, featureByClick))[0];

                            if (correspondingFeature.checked) {
                                let layerFeatures = elementsLayer.features.filter(f => !isSameFeature(f, featureByClick));
                                return replaceFeatures(layerFeatures.concat(
                                    [featureByClick].map(uncheckFeature)
                                ), elementsLayer);
                            }
                            let layerFeatures = elementsLayer.features.filter(f => !isSameFeature(f, featureByClick));
                            return replaceFeatures(layerFeatures.concat(
                                [featureByClick].map(checkFeature)
                            ), elementsLayer);
                        }
                    }
                    return Rx.Observable.of(infoElementAlreadyPresent());
                });
        });
export const updateCantieriAreaLayer = ( action$, store ) =>
    action$.ofType(END_DRAWING)
        .filter((action) => action.owner === "LavoriPubblici")
        .switchMap( (action) => {
            let cantieriState = store.getState().cantieri;
            let areasLayer = getAreasLayer(store);
            let feature = {
                type: "Feature",
                geometry: {
                    coordinates: [action.geometry.coordinates],
                    type: "MultiPolygon"
                },
                id: "area_0",
                geometry_name: cantieriState.geometry_name,
                properties: {
                    "ID_ELEMENTO": areaCount++,
                    "ID_CANTIERE": cantieriState.id,
                    "TIPOLOGIA": cantieriState.typology
                },
                index: 0
            };
            const options = {
                pagination: {
                    maxFeatures: cantieriState.maxFeatures
                },
                "featureTypeName": cantieriState.elementsLayerName
            };
            const f4326 = reprojectGeoJson(feature, store.getState().map.present.projection, "EPSG:4326");
            const f = getSpatialFilter(f4326.geometry, options, "WITHIN");
            if (areasLayer !== undefined) {
                return addFeatureToAreaLayer(feature, areasLayer).concat(Rx.Observable.of(queryElements(f, true)));
            }

            return Rx.Observable.of(errorDrawingAreas());
        });
export const deleteCantieriAreaFeature = ( action$, store ) =>
    action$.ofType(REMOVE_CANTIERI_AREA)
        .switchMap( (action) => {
            let areasLayer = getAreasLayer(store);
            if (areasLayer !== undefined) {
                return removeFeature(action.area, areasLayer);
            }
            return Rx.Observable.of(errorRemoveFeature());
        });
export const resetCantieriFeatures = ( action$, store ) =>
    action$.ofType(RESET_CANTIERI_FEATURES)
        .switchMap( () => {
            let areasLayer = getAreasLayer(store);
            let elementsLayer = getAreasLayer(store);
            if (areasLayer !== undefined && elementsLayer !== undefined) {
                return clearAllFeatures();
            }
            return Rx.Observable.of(errorResetCantieriFeatures());
        });
export const updateCantieriElementsFeatures = ( action$, store ) =>
    action$.ofType(QUERY_ELEMENTS_FEATURES)
        .switchMap( (action) => {
            let elementsLayer = getElementsLayer(store);
            let areasLayer = getAreasLayer(store);
            if (elementsLayer !== undefined && areasLayer !== undefined) {
                return getWFSFeature(store.getState().cantieri.geoserverUrl, action.filter)
                    .switchMap((response) => {
                        if (response.data && response.data.features && response.data.features.length > 0) {
                            let newFeatures = response.data.features.map(f => {
                                return reprojectGeoJson(f, "EPSG:4326", store.getState().map.present.projection);
                            }).filter(f => elementsLayer.features.findIndex(f2 => isSameFeature(f, f2)) < 0);
                            return addFeaturesToElementLayer(
                                elementsLayer,
                                areasLayer,
                                newFeatures.map(checkFeature),
                                response.data.totalFeatures,
                                store.getState().cantieri.maxFeatures,
                                action.check);
                        }
                        return showQueryElementsError();
                    }).catch( () => {
                        return showTimeoutError();
                    });
            }
            return showQueryElementsError();
        });
export const fetchCantieriAreaFeatures = ( action$, store ) =>
    action$.ofType(UPDATE_CHECKED_ELEMENTS)
        .switchMap( () => {
            const cantieriState = store.getState().cantieri;
            return Rx.Observable.forkJoin(
                // fetch areas features
                getWFSFeature(cantieriState.geoserverUrl, getAreaFilter(cantieriState.id, cantieriState.typology, cantieriState.areasLayerName))
                    .switchMap((response) => {
                        if (response.data && response.data.features && response.data.features.length) {
                            return Rx.Observable.of(response.data.features.map(f => {
                                return reprojectGeoJson(f, "EPSG:4326", store.getState().map.present.projection);
                            }));
                        }
                        return Rx.Observable.of([]);
                    }),
                // fetch checked elements features
                Rx.Observable.fromPromise(axios.post(store.getState().cantieri.geoserverUrl + '?service=WFS&outputFormat=json&request=getFeature',
                    getElementsFilter(store.getState().cantieri.checkedElements, store.getState().cantieri.elementsLayerName), {
                        timeout: 60000,
                        headers: {'Accept': 'application/json', 'Content-Type': 'application/json'}
                    }).then(r => r.data.features))
            ) // forkJoin
                .concatMap(([areas, elements]) => {
                    if (areas.length === 0) {
                        const checkedElements = elements.map(checkFeature).map(f => {
                            return reprojectGeoJson(f, "EPSG:4326", store.getState().map.present.projection);
                        });
                        return createAndAddLayers([], store, checkedElements);
                    }
                    // get elements for the areas received
                    return getWFSFeature(store.getState().cantieri.geoserverUrl,
                        getSpatialFilter(reprojectGeoJson(getAreasGeometry(areas), store.getState().map.present.projection), {"featureTypeName": store.getState().cantieri.elementsLayerName}, "WITHIN"), false)
                        .map((response) => {
                            if (response.data && response.data.features) {
                                let newFeatures = response.data.features.filter(f => elements.findIndex(f2 => isSameFeature(f, f2)) < 0 )
                                    .map( f => uncheckFeature(f))
                                    .concat(elements.map(checkFeature))
                                    .map(f => {
                                        return reprojectGeoJson(f, "EPSG:4326", store.getState().map.present.projection);
                                    });
                                return [areas, newFeatures];
                            }
                            return [];
                        }).concatMap((res) => createAndAddLayers(res[0], store, res[1]));
                })
                .startWith(loadingData(true))
                .catch( () => {
                    return createAndAddLayers([], store, []).concat(Rx.Observable.of(errorLoadCantieriAreas()));
                })
                .concat([loadingData(false)]);
        });
export const updateCantieriElementsStyle = ( action$, store ) =>
    action$.ofType(ROWS_SELECTED, ROWS_DESELECTED).switchMap( action => {
        const modifyFeatures = (f) => {
            const rowIndex = action.rows.findIndex(r => r.row.key === featureToRow(f).key);
            if (rowIndex >= 0) {
                if ( action.type === ROWS_SELECTED) {
                    return checkFeature(f);
                }
                return uncheckFeature(f);

            }
            return f;
        };
        const layer = getElementsLayer(store);
        let features = layer.features.map(modifyFeatures);

        return Rx.Observable.of(changeLayerProperties(layer.id, {features}));
    });
export const saveCantieriAreas = (action$, store) =>
    action$.ofType(SAVE_CANTIERI_DATA)
        .throttleTime(2000)
        .switchMap( () => {
            const cantierState = store.getState().cantieri;
            return Rx.Observable.defer( () => describeFeatureType(cantierState.geoserverUrl, getAreasLayer(store).name ) )
                .switchMap(describe => {
                    const {insert, deleteByFilter} = transactionRequestBuilder(describe);
                    return Rx.Observable.fromPromise(transaction(cantierState.geoserverUrl,
                        [
                            // SOME PROBLEM ON SERVER SIDE DO NOT ALLOW TO SAVE
                            deleteByFilter(
                                filter(and(property("ID_CANTIERE").equalTo(cantierState.id), property("TIPOLOGIA").equalTo(cantierState.typology)))
                            ),
                            insert(reprojectGeoJson({type: "FeatureCollection", features: getAreasLayer(store).features}, store.getState().map.present.projection, "EPSG:4326"))
                        ],
                        describe
                    )).switchMap(() =>
                        Rx.Observable.fromPromise(axios.post(getRestUrl(serviceRESTUrlSelector(store.getState()), "post", null),
                            prepareDataToSave(getCheckedElementsFromLayer(getElementsLayer(store)), store.getState().cantieri.id), {
                                timeout: 60000,
                                headers: {'Accept': 'application/json', 'Content-Type': 'application/json'}
                            }).then(r => {
                            if (r.data.STATO) {
                                return r.data;
                            }
                            return null;
                        }))
                            .switchMap((data) => {
                                if (data) {
                                    return Rx.Observable.from([
                                        dataSaved(getCheckedElementsFromLayer(getElementsLayer(store)), cantierState.id, cantierState.typology ),
                                        successSavingData()]
                                    );
                                }
                                return Rx.Observable.of(errorSavingElements(data && data.MESSAGGIO || "Non è stato possibile salvare gli elementi"));
                            }
                            ));
                })
                .startWith(savingData(true))
                .catch( () => Rx.Observable.of(errorSavingData()))
                .concat([savingData(false)]);
        });


export default {
    initLavoriPubbliciPlugin,
    updateCantieriByClick,
    updateCantieriAreaLayer,
    deleteCantieriAreaFeature,
    resetCantieriFeatures,
    updateCantieriElementsFeatures,
    fetchCantieriAreaFeatures,
    updateCantieriElementsStyle,
    saveCantieriAreas
};
