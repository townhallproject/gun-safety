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

const hasEventsColor = '#1b2455';
const maxBounds = [
  [24, -128], // Southwest
  [50, -60.885444], // Northeast
];

const usBB = [24, -128, 50, -60.885444];

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
    return this.zoomToNational();
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
    return geoViewport.viewport([maxBounds[0][1], maxBounds[0][0], maxBounds[1][1], maxBounds[1][0]], [w, h]);
  }

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
    function hasEvents(district) {
      return find(items, item => {
        return `${item.state}-${Number(item.district)}` === district;
      })
    }

    function setDistrictStyle(state) {
      const { properties } = state;
      const district = Number(properties.GEOID.substring(2));
      return {
        color: hasEvents(`${properties.ABR}-${district}`) ? '#fff' : 'transparent',
        fillColor: hasEvents(`${properties.ABR}-${district}`) ? hasEventsColor : 'transparent',
        fillOpacity: 1,
        opacity: 1,
        weight: hasEvents(`${properties.ABR}-${district}`) ? 2 : 0,
      };
    }

    this.stateColorLayer = new L.GeoJSON.AJAX('data/districts.geojson', {
      style(state) {
        return setDistrictStyle(state);
      },
    });
    this.stateColorLayer.addTo(this.map);
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
      console.log(properties)
      const eventInfo = properties;
      return `<div class="text-info map-popup">
                <h4 class="mapbox-popup-title">
                  </span>${eventInfo.displayName} (${eventInfo.state}-${Number(eventInfo.district)})</h4>
                    ${eventInfo.venue ? `<p>${eventInfo.venue}</p>` : ''}
                <span>
                  ${eventInfo.repeatingEvent ? `${eventInfo.repeatingEvent}` : `${eventInfo.time ? `${eventInfo.date} at ${eventInfo.time}` : ''}`}
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
        }).bindPopup(showTooltip(geoJsonPoint)).openPopup();
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
        color: '#f6f4f4',
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
      scrollWheelZoom: false,
    });
    this.map.fitBounds(maxBounds);
    this.makeZoomToNationalButton();
    this.resizeListener();
    this.stateLayer = new L.GeoJSON.AJAX('data/districts.geojson', {
      style(state) {
        return setStyle(state);
      },
    });

    this.stateLayer.addTo(this.map).bringToBack();
    this.addColorLayer(items);
    this.addLayer(featuresHome);
  }

  render() {

    return (
      <React.Fragment>
        <div id="map" className={this.state.popoverColor} ref={(ref) => { this.mapContainer = ref; }}>
          <div className="map-overlay" id="legend" />
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
