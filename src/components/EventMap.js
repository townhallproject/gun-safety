import React from 'react';
import PropTypes from 'prop-types';
import geoViewport from '@mapbox/geo-viewport';

import {
  find,
  filter,
  map,
} from 'lodash';
import bboxes from '../data/bboxes';
import Point from '../logics/features';
import states from '../data/states';

import L from '../utils/leaflet-ajax/src';

import MapInset from '../components/MapInset';
import { startSetEvents } from '../state/events/actions';

const maxBounds = [
  [24, -128], // Southwest
  [50, -60.885444], // Northeast
];

const usBB = [24, -128, 50, -60.885444]

class MapView extends React.Component {
  constructor(props) {
    super(props);
    this.addLayer = this.addLayer.bind(this);
    this.createFeatures = this.createFeatures.bind(this);
    this.updateData = this.updateData.bind(this);
    this.focusMap = this.focusMap.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.filterForStateInsets = this.filterForStateInsets.bind(this);
    this.insetOnClickEvent = this.insetOnClickEvent.bind(this);
    this.addColorLayer = this.addColorLayer.bind(this);
    this.continentalView = this.continentalView.bind(this);
    // this.makeZoomToNationalButton = this.makeZoomToNationalButton.bind(this);
    this.state = {
      alaskaItems: filter(this.props.items, { state: 'AK' }),
      hawaiiItems: filter(this.props.items, { state: 'HI' }),
      inset: !props.selectedUsState,
      popoverColor: 'popover-general-icon',
    };
  }

  componentDidMount() {
    const { items } = this.props;
    const featuresHome = this.createFeatures(items);
    this.initializeMap(featuresHome);
  }

  componentWillReceiveProps(nextProps) {
    const {
      center,
      items,
      distance,
      selectedItem,
      selectedUsState,
    } = nextProps;
    this.map.metadata = { searchType: nextProps.searchType };

    // Highlight selected item
    if (this.props.selectedItem !== selectedItem) {
      this.map.setFilter('unclustered-point-selected', ['==', 'id', selectedItem ? selectedItem.id : false]);
    }

    if (items.length !== this.props.items.length) {
      this.updateData(items, 'events-points');
      this.filterForStateInsets(items);
    }

    if (selectedUsState) {
      const bbname = selectedUsState.toUpperCase();
      const stateBB = bboxes[bbname];
      return this.focusMap(stateBB);
    }
    if (center.LNG) {
      if (this.state.inset === false) {
        return this.map.fitBounds(this.map.getBounds());
      }
      return this.map.flyTo(
        {
          lat: Number(center.LAT),
          lng: Number(center.LNG),
        },
        9.52 - (distance * (4.7 / 450)),
      );
    }
    return this.zoomToNational()
  }

  filterForStateInsets(items) {
    const alaskaItems = filter(items, { state: 'AK' });
    const hawaiiItems = filter(items, { state: 'HI' });
    this.setState({
      alaskaItems,
      hawaiiItems,
    });
  }


  resizeListener() {
    const { selectedUsState } = this.props;
    const { map } = this;

    window.addEventListener('resize', () => {
      if (selectedUsState) {
        const bbname = selectedUsState.toUpperCase();
        const stateBB = bboxes[bbname];

        return this.focusMap(stateBB);
      }
      return this.zoomToNational();
    });
  }

  continentalView() {
    const w = this.mapContainer.clientWidth;
    const h = this.mapContainer.clientHeight;
    // if (stateCoords) {
    //   return geoViewport.viewport(stateCoords, [w, h]);
    // } else {
    // return geoViewport.viewport([-123.719174, 32.528832, -66.885444, 47.459854], [w, h]);
    return geoViewport.viewport([maxBounds[0][1], maxBounds[0][0], maxBounds[1][1], maxBounds[1][0]], [w, h]);

    // }
  };

  insetOnClickEvent(e) {
    this.setState({ inset: false });
    const dataBounds = e.target.parentNode.parentNode.getAttribute('data-bounds').split(',');
    const boundsOne = [Number(dataBounds[0]), Number(dataBounds[1])];
    const boundsTwo = [Number(dataBounds[2]), Number(dataBounds[3])];
    const bounds = boundsOne.concat(boundsTwo);
    this.map.fitBounds(bounds);
  }

  zoomToNational() {
    this.map.flyToBounds(maxBounds);
  }

  focusMap(bb) {
    if (!bb) {
      return;
    }
    const container = this.mapContainer;
    const height = container.clientHeight;
    const width = container.clientWidth;

    const view = geoViewport.viewport(bb, [width, height]);
    if (view.zoom < 2.5) {
      view.zoom = 2.5;
    } else {
      view.zoom -= 0.5;
    }
    this.map.flyTo([view.center[1], view.center[0]], view.zoom);
  }

  updateData(items) {
    const featuresHome = this.createFeatures(items);
    this.markerLayer.remove();
    this.updateColorStyle(items);
    this.addLayer(featuresHome);
  }

  createFeatures(items) {
    const featuresHome = {
      features: [],
      type: 'FeatureCollection',
    };
    featuresHome.features = items.reduce((acc, townHall) => {
      const newFeature = new Point(townHall);
      if (townHall.lat) {
        acc.push(newFeature);
      }
      return acc;
    }, []);
    return featuresHome;
  }

  addColorLayer(items) {
    function hasEvents(state) {
      return find(items, item => item.state === state);
    }

    function setStateStyle(state) {
      const { properties } = state;
      return {
        color: hasEvents(properties.ABR) ? '#fff' : '#fff',
        fillColor: hasEvents(properties.ABR) ? '#6e00ff' : 'transparent',
        fillOpacity: 1,
        opacity: 1,
        weight: hasEvents(properties.ABR) ? 2 : 0.5,
      };
    }

    this.stateColorLayer = new L.GeoJSON.AJAX('data/states.geojson', {
      style(state) {
        return setStateStyle(state);
      },
    });
    this.stateColorLayer.addTo(this.map);
  }

  updateColorStyle(items) {
    function hasEvents(state) {
      return find(items, item => item.state === state);
    }
    function setStateStyle(state) {
      const { properties } = state;
      return {
        color: hasEvents(properties.ABR) ? '#fff' : '#fff',
        fillColor: hasEvents(properties.ABR) ? '#6e00ff' : 'transparent',
        fillOpacity: 1,
        opacity: 1,
        weight: hasEvents(properties.ABR) ? 2 : 0.5,
      };
    }
    this.stateColorLayer.setStyle(setStateStyle);
  }

  addLayer(featuresHome) {
    const myIcon = L.icon({
      iconUrl: './assets/campaign.svg',
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [-3, -76],
    });
    // Set map controls
    function showTooltip({ properties }) {
      const eventInfo = properties;
      return `<div class="text-info map-popup">
                <h4 class="mapbox-popup-title">
                  </span>${eventInfo.displayName}</h4>
                ${eventInfo.venue ? `<p>${eventInfo.venue}</p>` : ''}
                <span>
                  ${eventInfo.repeatingEvent ? `on ${eventInfo.repeatingEvent}` : `${eventInfo.time ? `on ${eventInfo.date} at ${eventInfo.time}` : ''}`}
                </span><br>
                  ${eventInfo.addressLink ?
    `<span><a href="${eventInfo.addressLink}" target="_blank">${eventInfo.address}</a></span>` :
    `${eventInfo.address ?
      `<span>${eventInfo.address}</span>` : ''
    }`}
                </div>`;
    }
    this.markerLayer = L.geoJSON(featuresHome, {
      pointToLayer(geoJsonPoint, latlng) {
        return L.marker(latlng, {
          icon: myIcon,
        }).bindTooltip(showTooltip(geoJsonPoint)).openTooltip();
      },
      style(feature) {
        return {
          color: '#f7ed54',
        };
      },
    });
    this.markerLayer.addTo(this.map);
  }

  handleReset() {
    const {
      selectedUsState,
      resetSelections,
    } = this.props;
    resetSelections();
    if (!selectedUsState) {
      this.setState({ inset: true });
    }
    this.zoomToNational();
  }

  // Creates the button in our zoom controls to go to the national view
  makeZoomToNationalButton() {
    const {
      selectedUsState,
    } = this.props;
    if (document.querySelector('.mapboxgl-ctrl-usa')) {
      document.querySelector('.mapboxgl-ctrl-usa').remove();
    }
    const usaButton = document.createElement('button');
    usaButton.className = 'mapboxgl-ctrl-icon mapboxgl-ctrl-usa ant-btn';
    if (selectedUsState) {
      usaButton.innerHTML = `<span>${selectedUsState}</span>`;
    } else {
      usaButton.innerHTML = '<span class="usa-icon"></span>';
    }
    usaButton.addEventListener('click', this.handleReset);
    document.querySelector('.leaflet-control-zoom').appendChild(usaButton);
  }

  initializeMap(featuresHome) {
    const { items } = this.props;

    function setStyle() {
      return {
        color: '#fff',
        fillColor: '#e9ebee',
        fillOpacity: 1,
        opacity: 1,
        weight: 0.5,
      };
    }

    const continental = this.continentalView();
    const { center } = continental;
    this.map = L.map('map', {
      attributionControl: false,
      center: [center[1], center[0]],
      zoomControl: true,
    });
    this.map.fitBounds(maxBounds);
    this.makeZoomToNationalButton();
    this.resizeListener();
    this.stateLayer = new L.GeoJSON.AJAX('data/states.geojson', {
      style(state) {
        return setStyle(state);
      },
    });

    this.stateLayer.addTo(this.map);
    this.addColorLayer(items);
    this.addLayer(featuresHome);
  }

  render() {
    const {
      center,
      district,
      type,
      resetSelections,
      refcode,
      setLatLng,
      distance,
      searchType,
      searchByQueryString,
      selectedUsState,
    } = this.props;

    return (
      <React.Fragment>
        <div id="map" className={this.state.popoverColor} ref={(ref) => { this.mapContainer = ref; }}>
          <div className="map-overlay" id="legend">
            <MapInset
              items={this.state.alaskaItems}
              selectedUsState={selectedUsState}
              center={center}
              stateName="AK"
              district={district}
              type={type}
              resetSelections={resetSelections}
              refcode={refcode}
              setLatLng={setLatLng}
              distance={distance}
              searchType={searchType}
              mapId="map-overlay-alaska"
              bounds={[[-170.15625, 51.72702815704774], [-127.61718749999999, 71.85622888185527]]}
            />
            <MapInset
              items={this.state.hawaiiItems}
              selectedUsState={selectedUsState}
              stateName="HI"
              center={center}
              district={district}
              type={type}
              resetSelections={resetSelections}
              refcode={refcode}
              setLatLng={setLatLng}
              distance={distance}
              searchType={searchType}
              searchByQueryString={searchByQueryString}
              mapId="map-overlay-hawaii"
              bounds={[
                [-161.03759765625, 18.542116654448996],
                [-154.22607421875, 22.573438264572406]]}
            />
          </div>
        </div>

      </React.Fragment>
    );
  }
}

MapView.propTypes = {
  center: PropTypes.shape({ LAT: PropTypes.string, LNG: PropTypes.string, ZIP: PropTypes.string }),
  distance: PropTypes.number,
  district: PropTypes.number,
  items: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  refcode: PropTypes.string,
  resetSelections: PropTypes.func.isRequired,
  searchByQueryString: PropTypes.func.isRequired,
  searchType: PropTypes.string,
  selectedItem: PropTypes.shape({}),
  selectedUsState: PropTypes.string,
  setLatLng: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
};

MapView.defaultProps = {
  center: {},
  distance: 50,
  district: NaN,
  refcode: '',
  searchType: 'proximity',
  selectedItem: null,
  selectedUsState: null,
};

export default MapView;
