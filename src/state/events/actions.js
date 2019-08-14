import moment from 'moment';

import getData from '../../logics/getData';

import { firebaseUrl } from '../constants';

import TownHall from './model';

export const setEvents = events => ({
  events,
  type: 'SET_EVENTS',
});

export const setFeaturesHome = featuresHome => ({
  featuresHome,
  type: 'SET_FEATURES_HOME',
});

const include = (event) => {
  if (event.meetingType === 'Gun Safety Activist Event') {
    return true;
  }
  if (event.chamber === 'lower') {
    if (event.iconFlag === 'in-person') {
      return event.meetingType !== 'DC Event';
    }
  } else if (event.iconFlag === 'in-person' || event.iconFlag === 'tele') {
    return event.meetingType !== 'DC Event';
  }

  return false;
};

export const startSetEvents = () => (dispatch) => {
  const url = `${firebaseUrl}/townHalls.json`;
  return getData(url).then((result) => {
    const allevents = result.body;
    const events = Object.keys(allevents)
      .map(id => new TownHall(allevents[id]))
      .filter(event => include(event))
      .sort((a, b) => ((moment(a.dateObj).isSameOrAfter(moment(b.dateObj))) ? 1 : -1));
    return (dispatch(setEvents(events)));
  });
};
