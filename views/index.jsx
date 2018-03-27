import React from 'react';
import PropTypes from 'prop-types';
import Layout from './layout';
import Watsonbody from './watsonbody';

export default function Index(props) {
  return (<Layout bluemixAnalytics={props.bluemixAnalytics} ><Watsonbody /></Layout>);
}

Index.defaultProps = {
  bluemixAnalytics: false,
};

Index.propTypes = {
  bluemixAnalytics: PropTypes.bool,
};
