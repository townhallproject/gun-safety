import React from 'react';
import PropTypes from 'prop-types';
import {
  Col, 
  Input,
  Row,
} from 'antd';

/* eslint-disable */
require('style-loader!css-loader!antd/es/style/index.css');
require('style-loader!css-loader!antd/es/input/style/index.css');
/* eslint-enable */

const { Search } = Input;

class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(value) {
    const {
      submitHandler,
    } = this.props;
    submitHandler(Object.assign({}, { query: value }));
  }

  render() {
    return (
      <Row type="flex" align="middle">
        <Col>
          <h6 style={{ display: 'inline', marginRight: 8 }}>Find an event near you:</h6>
        </Col>
        <Search
          placeholder="zipcode or state"
          onSearch={value => this.handleSubmit(value)}
        />
      </Row>
    );
  }
}

SearchBar.propTypes = {
  submitHandler: PropTypes.func.isRequired,
};

export default SearchBar;
