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
      <Row type="flex" align="middle" justify="space-around">
        <Col span={11}>
          <h2 className="title">Find an event with your representatives</h2><h2 className="sub-title">and tell them why gun safety matters to you:</h2>
        </Col>
        <Col span={7}>
          <Search
            placeholder="zipcode or state"
            onSearch={value => this.handleSubmit(value)}
          />
        </Col>
      </Row>
    );
  }
}

SearchBar.propTypes = {
  submitHandler: PropTypes.func.isRequired,
};

export default SearchBar;
