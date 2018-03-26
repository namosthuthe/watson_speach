import React from 'react';
import PropTypes from 'prop-types';
import Layout from './layout';
import Newdemo from './newdemo';

export default function Index(props) {
  return (<Layout bluemixAnalytics={props.bluemixAnalytics} ><Newdemo /></Layout>);
}

Index.defaultProps = {
  bluemixAnalytics: false,
};

Index.propTypes = {
  bluemixAnalytics: PropTypes.bool,
};
