import React from 'react';
import PropTypes from 'prop-types';

import { Card } from 'antd';

/* eslint-disable */
require('style-loader!css-loader!antd/es/card/style/index.css');
require('style-loader!css-loader!antd/es/button/style/index.css');
/* eslint-enable */

class TableCell extends React.Component {
  static handlePanelOpen(e) {
    const ele = document.getElementById(e.target.id);
    if (ele.classList.contains('open')) {
      ele.classList.remove('open');
      ele.classList.add('closed');
    } else {
      ele.classList.remove('closed');
      ele.classList.add('open');
    }
  }

  constructor(props) {
    super(props);
    this.renderEvents = this.renderEvents.bind(this);
  }

  renderEvents() {
    const {
      item,
      iconName,
    } = this.props;
    const chamber = item.district ? <div>{item.state}-{Number(item.district)}</div> : <div>{item.state}</div>;
    const title = item.meetingType === 'Gun Safety Activist Event' ?
      ['Activism Event', <br />, item.state] :
      [item.displayName, chamber, item.party[0]];
    return (
      <Card
        className={`event-cell ${iconName}  ${item.party[0]}`}
        key={`${item.id}`}
        title={title}
      >
        <ul>
          {item.eventName}
        </ul>
        <ul>
          <li className="semi-bold">{item.date}</li>
          <li className="semi-bold">{item.time}</li>
          <li>{item.address}</li>
          <li className="read-more closed" onClick={TableCell.handlePanelOpen} id={item.id}>
            {item.public_description}
          </li>
        </ul>
      </Card>);
  }

  render() {
    return (
      <React.Fragment>
        {this.renderEvents()}
      </React.Fragment>
    );
  }
}

TableCell.propTypes = {
  iconName: PropTypes.string,
  item: PropTypes.shape({}).isRequired,
};

TableCell.defaultProps = {
  iconName: '',
};

export default TableCell;
