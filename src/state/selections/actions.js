import superagent from 'superagent';

import { firebaseUrl } from '../constants';

export const setLatLng = payload => ({
  payload,
  type: 'SET_LAT_LNG',
});

export const setUsState = payload => ({
  payload,
  type: 'SET_US_STATE',
});

export const resetSelections = () => ({
  type: 'RESET_SELECTIONS',
});

export const resetSearchByZip = () => ({
  type: 'RESET_LAT_LNG',
});

export const setRefCode = (payload = '') => ({
  payload,
  type: 'SET_REFCODE',
});

export const setTextFilter = (payload = '') => ({
  payload,
  type: 'SET_TEXT_FILTER',
});

export const setDistance = (payload = 50) => ({
  payload,
  type: 'SET_DISTANCE',
});

export const searchByQueryString = payload => ({
  payload,
  type: 'SEARCH_BY_KEY_VALUE',
});

export const resetSearchByQueryString = () => ({
  type: 'RESET_SEARCH_BY_KEY_VALUE',
});

export const changeSearchType = payload => ({
  payload,
  type: 'SET_SEARCH_TYPE',
});

export const setInitialFilters = payload => ({
  payload,
  type: 'SET_INITIAL_FILTERS',
});

export const setNameFilter = payload => ({
  payload,
  type: 'SET_NAME_FILTER',
});

export const getLatLngFromZip = payload => (dispatch) => {
  if (!payload.query) {
    return dispatch(setLatLng({}));
  }
  return superagent.get(`${firebaseUrl}/zips/${payload.query}.json`)
    .then((res) => {
      dispatch(setLatLng(res.body));
    })
    .catch();
};
