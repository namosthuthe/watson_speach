import React from 'react';
import PropTypes from 'prop-types';

export default function Displaymsg(props) {
  var messgBoxStyle = {
    border: "1px solid black",
    padding: "15px"
  }
  try {
    // When resultsBySpeaker is enabled, each msg.results array may contain multiple results.
    // The result_index is for the first result in the message,
    // so we need to count up from there to calculate the key.
    const results = props.messages.map(msg =>
      msg.results.map((result, i) => (
        <span key={`result-${msg.result_index + i}`}>{result.alternatives[0].transcript}</span>
      )),
    ).reduce((a, b) => a.concat(b), []); // the reduce() call flattens the array
    // console.log("results "+results==""?"true":"false");
    // console.log("results "+JSON.stringify(results));
    return (
      <div style={messgBoxStyle}>
        {results.length?results:<span style={{color: "grey"}}>Select an audio file to start transcribing</span>}
      </div>
    );
  } catch (ex) {
    console.log(ex);
    return <div>{ex.message}</div>;
  }
}

Displaymsg.propTypes = {
  messages: PropTypes.array.isRequired, // eslint-disable-line
};
