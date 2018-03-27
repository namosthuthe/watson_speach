import React from 'react';
import PropTypes from 'prop-types';
import Layout from './layout';
import Watsonbody from './watsonbody';

export default function Index(props) {
  return (<Layout><Watsonbody /></Layout>);
}

Index.defaultProps = {
  bluemixAnalytics: false,
};

Index.propTypes = {
  bluemixAnalytics: PropTypes.bool,
};
