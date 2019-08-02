import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { find } from 'lodash';
import Point from '../logics/features';
import L from '../utils/leaflet-ajax/src';

class MapInset extends React.Component {
  constructor(props) {
    super(props);
    this.addClickListener = this.addClickListener.bind(this);
    this.addLayer = this.addLayer.bind(this);
    this.createFeatures = this.createFeatures.bind(this);
    this.updateData = this.updateData.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.addColorLayer = this.addColorLayer.bind(this);
  }

  componentDidMount() {
    const { items } = this.props;
    const featuresHome = this.createFeatures(items);
    this.initializeMap(featuresHome);
  }

  componentWillReceiveProps(nextProps) {
    const {
      items,
      type,
      selectedItem,
    } = nextProps;
    this.map.metadata = { searchType: nextProps.searchType };

    if (items.length !== this.props.items.length) {
      this.updateData(items, `${type}-points`);
    }
    // Highlight selected item
    if (this.props.selectedItem !== selectedItem) {
      this.map.setFilter('unclustered-point-selected', ['==', 'id', selectedItem ? selectedItem.id : false]);
    }
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
    const { type } = this.props;

    featuresHome.features = items.map((indEvent) => {
      let colorObject = {
          ...indEvent,
          color: '#1cb7ec',
          filterBy: false,
          icon: 'circle-15-blue',
        };
      const newFeature = new Point(colorObject);
      return newFeature;
    });
    return featuresHome;
  }

  districtSelect(feature) {
    if (feature.state) {
      this.highlightDistrict(feature.geoID);
    } else {
      const visibility = this.map.getLayoutProperty('selected-fill', 'visibility');
      if (visibility === 'visible') {
        this.map.setLayoutProperty('selected-fill', 'visibility', 'none');
        this.map.setLayoutProperty('selected-border', 'visibility', 'none');
      }
    }
  }

  toggleFilters(layer, filter) {
    this.map.setFilter(layer, filter);
    this.map.setLayoutProperty(layer, 'visibility', 'visible');
  }

  // Handles the highlight for districts when clicked on.
  highlightDistrict(geoid) {
    let filter;
    // Filter for which district has been selected.
    if (typeof geoid === 'object') {
      filter = ['any'];

      geoid.forEach((i) => {
        filter.push(['==', 'GEOID', i]);
      });
    } else {
      filter = ['all', ['==', 'GEOID', geoid]];
    }
    // Set that layer filter to the selected
    this.toggleFilters('selected-fill', filter);
    this.toggleFilters('selected-border', filter);
  }

  addClickListener() {
    const {
      searchByQueryString,
      stateName,
    } = this.props;
    const { map } = this;

    map.on('click', () => {
      searchByQueryString({ filterBy: 'state', filterValue: stateName });
    });
  }

  addLayer(featuresHome) {
    const myIcon = L.icon({
      iconUrl: './assets/campaign.svg',
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [-3, -76],
    });
    // Set map controls
    function showTooltip({
      properties,
    }) {
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
    this.props.resetSelections();
  }

  addColorLayer(items) {
    function hasEvents(state) {
      return find(items, item => item.state === state);
    }

    function setStateStyle(state) {
      const {
        properties,
      } = state;
      return {
        color: hasEvents(properties.ABR) ? '#fff' : '#fff',
        fillColor: hasEvents(properties.ABR) ? '#6e00ff' : 'transparent',
        fillOpacity: 1,
        opacity: 1,
        weight: hasEvents(properties.ABR) ? 2 : 0.5,
      };
    }
  }

  initializeMap(featuresHome) {
    const {
      bounds,
      mapId,
      type,
      searchType,
      stateName,
    } = this.props;

    const {
      items,
    } = this.props;

    function setStyle() {
      return {
        color: '#fff',
        fillColor: '#e9ebee',
        fillOpacity: 1,
        opacity: 1,
        weight: 0.5,
      };
    }
    this.map = L.map(mapId, {
      attributionControl: false,
      zoomControl: false,
    });
    this.map.fitBounds(bounds);
    console.log(bounds)
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
      mapId,
      selectedUsState,
    } = this.props;
    const mapClassNames = classNames({
      hidden: center.LAT || selectedUsState,
      inset: true,
    });
    return (
      <React.Fragment>
        <div id={mapId} className={mapClassNames} data-bounds={this.props.bounds} />
      </React.Fragment>
    );
  }
}

MapInset.propTypes = {
  bounds: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  center: PropTypes.shape({ LAT: PropTypes.string, LNG: PropTypes.string, ZIP: PropTypes.string }),
  items: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  mapId: PropTypes.string.isRequired,
  resetSelections: PropTypes.func.isRequired,
  searchByQueryString: PropTypes.func.isRequired,
  searchType: PropTypes.string,
  selectedItem: PropTypes.PropTypes.shape({}),
  selectedUsState: PropTypes.string,
  stateName: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
};

MapInset.defaultProps = {
  center: {},
  searchType: 'proximity',
  selectedItem: null,
  selectedUsState: null,
};

export default MapInset;
