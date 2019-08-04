import moment from 'moment';
import { includes } from 'lodash';

import getData from '../../logics/getData';

import { firebaseUrl, districtsToInclude, statesToInclude, senatorsToInclude } from '../constants';

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
  if (event.chamber === 'lower') {
    if (!includes(districtsToInclude, `${event.state}-${Number(event.district)}`)) {
      return false;
    }
  } else {
    if (!includes(statesToInclude, event.state)) {
      return false;
    }
    if (!includes(senatorsToInclude, event.displayName.split(' ')[1])) {
      return false;
    }
  }
  if (event.iconFlag === 'in-person') {
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
