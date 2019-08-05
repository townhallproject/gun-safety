import React from 'react';
import { Affix } from 'antd';

export default class FloatingIcon extends React.Component {
  constructor(props) {
    super(props);
    this.showFull = this.showFull.bind(this);
    this.showMin = this.showMin.bind(this);
    this.state = {
      full: true,
    };
  }

  componentDidMount() {
        const component = this;
    window.addEventListener('scroll', function (e) {
      if (window.scrollY > 0 && component.state.full) {
        component.setState({
            full: false
        });
      }
      if (window.scrollY === 0 && !component.state.full) {
        component.setState({
            full: true
        });
      }
    });
  }

  showFull() {
    this.setState({ full: true });
  }

  showMin() {
    this.setState({ full: false });
  }

  render() {
    const fullView = (
      <Affix
        offsetTop={10}
        style={{ position: 'absolute', height: '80px' }}
        className="learn-more"
        onMouseExit={this.showMin}
      >
        <a
            target="_blank"
            href="https://docs.google.com/document/d/1Go1GsYldM9iRLzpvQP1GZVjRXBjJ7Qcm8Xk_ku86lEQ/edit#"
        >Learn more at the<br /> <strong>Gun Violence Recess Toolkit</strong>
        </a>
      </Affix>);
    const minView = (
      <Affix
        onMouseEnter={this.showFull}
        offsetTop={10}
        style={{ position: 'absolute', height: '80px', width: 'initial' }}
        className="learn-more min"
      >
        <a
            target="_blank"
            href="https://docs.google.com/document/d/1Go1GsYldM9iRLzpvQP1GZVjRXBjJ7Qcm8Xk_ku86lEQ/edit#"
          >Toolkit
          </a>
      </Affix>
    );
    return this.state.full ? fullView : minView;
  }
}
