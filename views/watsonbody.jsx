import React from 'react';
import Dropzone from 'react-dropzone';
import recognizeMicrophone from 'watson-speech/speech-to-text/recognize-microphone';
import recognizeFile from 'watson-speech/speech-to-text/recognize-file';
import ModelDropdown from './model-dropdown.jsx';
import Displaymsg from './displaymsg.jsx';
import Recordbtn from './recordbtn.jsx';

const ERR_MIC_NARROWBAND = 'Microphone transcription cannot accommodate narrowband voice models, please select a broadband one.';

export default React.createClass({
  displayName: 'Watsonbody',

  getInitialState() {
    return {
      model: 'en-US_BroadbandModel',
      rawMessages: [],
      formattedMessages: [],
      audioSource: null,
      settingsAtStreamStart: {
        model: '',
      },
      error: null,
    };
  },

  reset() {
    if (this.state.audioSource) {
      this.stopTranscription();
    }
    this.setState({ rawMessages: [], formattedMessages: [], error: null });
  },

  captureSettings() {
    this.setState({
      settingsAtStreamStart: {
        model: this.state.model,
      },
    });
  },

  stopTranscription() {
    if (this.stream) {
      this.stream.stop();
    }
    this.setState({ audioSource: null });
  },

  getRecognizeOptions(extra) {
    return Object.assign({
      token: this.state.token,
      smart_formatting: true,
      format: true, // adds capitals, periods, and a few other things (client-side)
      model: this.state.model,
      objectMode: true,
      interim_results: true,
      word_alternatives_threshold: 0.01,
      timestamps: true, // set timestamps for each word - automatically turned on by speaker_labels
    }, extra);
  },

  isNarrowBand(model) {
    model = model || this.state.model;
    return model.indexOf('Narrowband') !== -1;
  },


  handleUploadClick() {
    if (this.state.audioSource === 'upload') {
      this.stopTranscription();
    } else {
      this.dropzone.open();
    }
  },

  handleUserFile(files) {
    const file = files[0];
    if (!file) {
      return;
    }
    this.reset();
    this.setState({ audioSource: 'upload' });
    this.playFile(file);
  },

  handleUserFileRejection() {
    this.setState({ error: 'Sorry, that file does not appear to be compatible.' });
  },

  playFile(file) {
    this.handleStream(recognizeFile(this.getRecognizeOptions({
      file,
      play: true, // play the audio out loud
      realtime: true,
    })));
  },

  handleStream(stream) {
    if (this.stream) {
      this.stream.stop();
      this.stream.removeAllListeners();
      this.stream.recognizeStream.removeAllListeners();
    }
    this.stream = stream;
    this.captureSettings();

    stream.on('data', this.handleFormattedMessage).on('end', this.handleTranscriptEnd).on('error', this.handleError);
    stream.recognizeStream.on('end', () => {
      if (this.state.error) {
        this.handleTranscriptEnd();
      }
    });

  },


  handleFormattedMessage(msg) {
    this.setState({ formattedMessages: this.state.formattedMessages.concat(msg) });
  },

  handleTranscriptEnd() {
    this.setState({ audioSource: null });
  },

  componentDidMount() {
    this.fetchToken();
    this.setState({ tokenInterval: setInterval(this.fetchToken, 50 * 60 * 1000) });
  },

  componentWillUnmount() {
    clearInterval(this.state.tokenInterval);
  },

  fetchToken() {
    return fetch('/api/token').then((res) => {
      if (res.status !== 200) {
        throw new Error('Error retrieving auth token');
      }
      return res.text();
    }) // todo: throw here if non-200 status
      .then(token => this.setState({ token })).catch(this.handleError);
  },


  handleModelChange(model) {
    this.reset();
    this.setState({ model,
    });

    // clear the microphone narrowband error if it's visible and a broadband model was just selected
    if (this.state.error === ERR_MIC_NARROWBAND && !this.isNarrowBand(model)) {
      this.setState({ error: null });
    }

  },

  getFinalResults() {
    return this.state.formattedMessages.filter(r => r.results &&
      r.results.length && r.results[0].final);
  },

  getCurrentInterimResult() {
    const r = this.state.formattedMessages[this.state.formattedMessages.length - 1];
    if (!r || !r.results || !r.results.length || r.results[0].final) {
      return null;
    }
    return r;
  },

  getFinalAndLatestInterimResult() {
    const final = this.getFinalResults();
    const interim = this.getCurrentInterimResult();
    if (interim) {
      final.push(interim);
    }
    return final;
  },

  handleError(err, extra) {
    console.error(err, extra);
    if (err.name === 'UNRECOGNIZED_FORMAT') {
      err = 'Unable to determine content type from file name or header; mp3, wav, flac, ogg, opus, and webm are supported. Please choose a different file.';
    } else if (err.name === 'NotSupportedError' && this.state.audioSource === 'mic') {
      err = 'This browser does not support microphone input.';
    } else if (err.message === '(\'UpsamplingNotAllowed\', 8000, 16000)') {
      err = 'Please select a narrowband voice model to transcribe 8KHz audio files.';
    } else if (err.message === 'Invalid constraint') {
      // iPod Touch does this on iOS 11 - there is a microphone, but Safari claims there isn't
      err = 'Unable to access microphone';
    }
    this.setState({ error: err.message || err });
  },

  render() {

    const err = this.state.error
      ? (
          <p>{this.state.error}</p>
      )
      : null;

    const messages = this.getFinalAndLatestInterimResult();

    return (

      <Dropzone
        onDropAccepted={this.handleUserFile}
        onDropRejected={this.handleUserFileRejection}
        maxSize={200 * 1024 * 1024}
        accept="audio/wav, audio/mp3, audio/mpeg, audio/l16, audio/ogg, audio/flac, .mp3, .mpeg, .wav, .ogg, .opus, .flac" // eslint-disable-line
        disableClick
        className="dropzone _container _container_large"
        activeClassName="dropzone-active"
        rejectClassName="dropzone-reject"
        ref={(node) => {
          this.dropzone = node;
        }}
      >


          <ModelDropdown
            model={this.state.model}
            token={this.state.token}
            onChange={this.handleModelChange}
          />


          <button onClick={this.handleUploadClick}>
            <Recordbtn message={this.state.audioSource === 'upload' ? 'stop' : 'upload'} />
          </button>

        {err}

        <Displaymsg  messages={messages} />

      </Dropzone>
    );
  },
});
