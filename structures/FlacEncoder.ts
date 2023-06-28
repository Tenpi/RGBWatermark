export class FlacEncoder {
    Flac: any
    _options: any 
    _isError: any 
    _isInitialized: any
    _isFinished: any
    data: any
    _id: any 
    _onDestroyed: any
    _beforeReadyHandler: any
    _onWrite: any
    _onMetaData: any
    _metadata: any
    constructor(Flac, _options) {
        this.Flac = Flac;
        this._options = _options;
        this._isError = false;
        this._isInitialized = false;
        this._isFinished = false;
        /**
         * cache for the encoded data
         */
        this.data = [];
        this._id = Flac.create_libflac_encoder(_options.sampleRate, _options.channels, _options.bitsPerSample, _options.compression, _options.totalSamples, _options.verify);
        this._onDestroyed = (evt) => {
            var _a;
            if (evt.target.id === this._id) {
                this._id = void (0);
                this._isInitialized = false;
                this._isFinished = false;
                Flac.off('destroyed', this._onDestroyed);
                if ((_a = this._beforeReadyHandler) === null || _a === void 0 ? void 0 : _a.enabled) {
                    this._beforeReadyHandler.enabled = false;
                }
            }
        };
        Flac.on('destroyed', this._onDestroyed);
        this._onWrite = (data) => {
            this.addData(data);
        };
        this._onMetaData = (m) => {
            if (m) {
                this._metadata = m;
            }
        };
        if (this._id === 0) {
            this._isError = true;
        }
        else {
            // if(this._isAnalyse(this._options)){
            // 	Flac.setOptions(this._id, this._options);
            // }
            this._init(this._options.isOgg);
        }
    }
    get initialized() {
        return this._isInitialized;
    }
    get finished() {
        return this._isFinished;
    }
    get metadata() {
        return this._metadata;
    }
    get rawData() {
        return this.data;
    }
    get isWaitOnReady() {
        var _a;
        return ((_a = this._beforeReadyHandler) === null || _a === void 0 ? void 0 : _a.isWaitOnReady) || false;
    }
    _init(isEncodeOgg) {
        if (this._id) {
            const state = isEncodeOgg ?
                this.Flac.init_encoder_ogg_stream(this._id, this._onWrite, this._onMetaData) :
                this.Flac.init_encoder_stream(this._id, this._onWrite, this._onMetaData);
            this._isError = state !== 0;
            if (state === 0) {
                this._isInitialized = true;
                this._isFinished = false;
            }
        }
        else {
            this._handleBeforeReady('_init', arguments);
        }
    }
    /**
     * reset encoder:
     * resets internal state and clears cached input/output data.
     */
    reset(options) {
        if (this._id) {
            // do reset encoder, if it was initialized -> call finished()
            let state = this.Flac.FLAC__stream_encoder_get_state(this._id);
            if (state === /* FLAC__STREAM_ENCODER_OK */ 0) {
                this.Flac.FLAC__stream_encoder_finish(this._id);
                state = this.Flac.FLAC__stream_encoder_get_state(this._id);
            }
            if (state === /* FLAC__STREAM_ENCODER_UNINITIALIZED */ 1) {
                if (options) {
                    Object.assign(this._options, options);
                    // if(this._isAnalyse(this._options)){
                    // 	Flac.setOptions(this._id, this._options);
                    // }
                    if (typeof options.verify !== 'undefined' && this.Flac.FLAC__stream_encoder_get_verify(this._id) != /*non-exact comparision*/ this._options.verify) {
                        this.Flac.FLAC__stream_encoder_set_verify(this._id, !!this._options.verify);
                    }
                    // TODO unsupported as of yet:
                    // if(typeof options.sampleRate !== 'number'){
                    // 	this.Flac.FLAC__stream_encoder_set_sample_rate(this._id, this._options.sampleRate);
                    // }
                    // if(typeof options.channels !== 'number'){
                    // 	this.Flac.FLAC__stream_encoder_set_channels(this._id, this._options.channels);
                    // }
                    // if(typeof options.bitsPerSample !== 'number'){
                    // 	this.Flac.FLAC__stream_encoder_set_bits_per_sample(this._id, this._options.bitsPerSample);
                    // }
                    // if(typeof options.totalSamples !== 'number'){
                    // 	this.Flac.FLAC__stream_encoder_set_total_samples_estimate(this._id, this._options.totalSamples);
                    // }
                    if (typeof options.compression !== 'number') {
                        this.Flac.FLAC__stream_encoder_set_compression_level(this._id, this._options.compression);
                    }
                }
                this.clearData();
                this._metadata = undefined;
                this._isInitialized = false;
                this._isFinished = false;
                this._init(this._options.isOgg);
                return this._isError;
            }
        }
        return this._handleBeforeReady('reset', arguments);
    }
    /**
     * encode PCM data to FLAC
     * @param  pcmData the PCM data: either interleaved, or an array of the channels
     * @param  numberOfSamples the number of samples (for one channel)
     * @param  isInterleaved if the PCM data is interleaved or an array of channel PCM data
     * @return <code>true</code> if encoding was successful
     *
     * @throws Error in case non-interleaved encoding data did not match the number of expected channels
     */
    encode(pcmData?, numberOfSamples?, isInterleaved?) {
        if (this._id && this._isInitialized && !this._isFinished) {
            // console.log('encoding with ', this._options, pcmData);
            if (typeof pcmData === 'undefined') {
                // console.log('finish encoding...');
                return this._finish();
            }
            if (typeof isInterleaved === 'undefined') {
                // console.log('determining interleaved ...');
                isInterleaved = !(Array.isArray(pcmData) && pcmData[0] instanceof Int32Array);
                // console.log('is interleaved?: ', isInterleaved);
            }
            if (typeof numberOfSamples === 'undefined') {
                // console.log('calculating numberOfSamples...');
                // const byteNum = this._options.bitsPerSample / 8;
                const buff = isInterleaved ? pcmData : pcmData[0];
                // console.log('calculating numberOfSamples: byteNum='+byteNum+' for buffer ', buff);
                numberOfSamples = (buff.byteLength - buff.byteOffset) / ((isInterleaved ? this._options.channels : 1) * buff.BYTES_PER_ELEMENT); // * byteNum);
            }
            if (isInterleaved) {
                // console.log('encoding interleaved ('+numberOfSamples+' samples)...');
                return !!this.Flac.FLAC__stream_encoder_process_interleaved(this._id, pcmData, numberOfSamples);
            }
            // ASSERT encode non-interleaved
            if (this._options.channels !== pcmData.length) {
                throw new Error(`Wrong number of channels: expected ${this._options.channels} but got ${pcmData.length}`);
            }
            // console.log('encoding non-interleaved ('+numberOfSamples+' samples)...');
            return !!this.Flac.FLAC__stream_encoder_process(this._id, pcmData, numberOfSamples);
        }
        return this._handleBeforeReady('encode', arguments);
    }
    getSamples() {
        return this.mergeBuffers(this.data, this.getLength(this.data));
    }
    getState() {
        if (this._id) {
            return this.Flac.FLAC__stream_encoder_get_state(this._id);
        }
        return -1;
    }
    destroy() {
        if (this._id) {
            this.Flac.FLAC__stream_encoder_delete(this._id);
        }
        this._beforeReadyHandler && (this._beforeReadyHandler.enabled = false);
        this._metadata = void (0);
        this.clearData();
    }
    addData(decData) {
        this.data.push(decData);
    }
    clearData() {
        this.data.splice(0);
    }
    _finish() {
        if (this._id && this._isInitialized && !this._isFinished) {
            if (!!this.Flac.FLAC__stream_encoder_finish(this._id)) {
                this._isFinished = true;
                return true;
            }
            ;
        }
        return false;
    }
    _handleBeforeReady(funcName, args) {
        if (this._beforeReadyHandler) {
            return this._beforeReadyHandler.handleBeforeReady(funcName, args);
        }
        return false;
    }
    mergeBuffers (channelBuffer, recordingLength) {
        var result = new Uint8Array(recordingLength)
        var offset = 0
        var lng = channelBuffer.length
        for (var i = 0; i < lng; i++) {
            var buffer = channelBuffer[i]
            result.set(buffer, offset)
            offset += buffer.length
        }
        return result
    }
    getLength (recBuffers) {
        var recLength = 0
        for (var i = recBuffers.length - 1; i >= 0; --i) {
            recLength += recBuffers[i].byteLength
        }
        return recLength
    }
    writeMd5(view, offset, str) {
        var index
        for (var i = 0; i < str.length / 2; ++i) {
            index = i * 2
            view.setUint8(i + offset, parseInt(str.substring(index, index + 2), 16))
        }
    }
    addFLACMetaData (chunks: any, metadata: any, isOgg: boolean) {
        var offset = 4
        var dataIndex = 0
        var data = chunks[0]
        if (isOgg) {
            offset = 13
            dataIndex = 1
            if (data.length < 4 || String.fromCharCode.apply(null, data.subarray(0, 4)) != "OggS") {
                console.error('Unknown data format: cannot add additional FLAC meta data to OGG header');
                return;
            }
        }
        data = chunks[dataIndex]
        if (data.length < 4 || String.fromCharCode.apply(null, data.subarray(offset - 4, offset)) != "fLaC") {
            console.error('Unknown data format: cannot add additional FLAC meta data to header')
            return
        }
        if (isOgg) {
            console.info('OGG Container: cannot add additional FLAC meta data to header due to OGG format\'s header checksum!')
            return
        }
        if (data.length == 4) {
            data = chunks[dataIndex + 1]
            offset = 0
        }
        var view = new DataView(data.buffer)
        view.setUint8(8 + offset, metadata.min_framesize >> 16)
        view.setUint8(9 + offset, metadata.min_framesize >> 8)
        view.setUint8(10 + offset, metadata.min_framesize)
        view.setUint8(11 + offset, metadata.max_framesize >> 16)
        view.setUint8(12 + offset, metadata.max_framesize >> 8)
        view.setUint8(13 + offset, metadata.max_framesize)
        view.setUint8(18 + offset, metadata.total_samples >> 24)
        view.setUint8(19 + offset, metadata.total_samples >> 16)
        view.setUint8(20 + offset, metadata.total_samples >> 8)
        view.setUint8(21 + offset, metadata.total_samples)
        this.writeMd5(view, 22 + offset, metadata.md5sum)
    }
    exportFlacFile (recBuffers: Uint8Array[], metaData: any, isOgg: boolean) {
        const recLength = this.getLength(recBuffers)
        if (metaData) {
            this.addFLACMetaData(recBuffers, metaData, isOgg)
        }
        const samples = this.mergeBuffers(recBuffers, recLength)
        return new Blob([samples], {type: isOgg ? "audio/ogg" : "audio/flac"})
    }
    convert_8bitdata_to32bitdata(dataView, i) {
        return dataView.getUint8(i) - 128 /* 0x80 */;
    }
    /**
     *  converts the PCM data of the wav file (each sample stored as 16 bit value) into
     *  a format expected by the libflac-encoder method (each sample stored as 32 bit value in a 32-bit array)
     */
    convert_16bitdata_to32bitdata(dataView, i) {
        return dataView.getInt16(i, true);
    }
    /**
     *  converts the PCM data of the wav file (each sample stored as 24 bit value) into
     *  a format expected by the libflac-encoder method (each sample stored as 32 bit value in a 32-bit array)
     */
    convert_24bitdata_to32bitdata(dataView, i) {
        var b = (((dataView.getUint8(i + 2) << 8) | dataView.getUint8(i + 1)) << 8) | dataView.getUint8(i);
        if ((b & 8388608 /* 0x00800000 */) > 0) {
            b |= 4278190080; // 0xFF000000;
        }
        else {
            b &= 16777215; // 0x00FFFFFF;
        }
        return b;
    }
    wav_file_processing_convert_to32bitdata(arraybuffer, bps) {
        var decFunc;
        switch (bps) {
            case 8:
                decFunc = this.convert_8bitdata_to32bitdata;
                break;
            case 16:
                decFunc = this.convert_16bitdata_to32bitdata;
                break;
            case 24:
                decFunc = this.convert_24bitdata_to32bitdata;
                break;
        }
        if (!decFunc) {
            // -> unsupported bit-depth
            return void (0);
        }
        var bytes = bps / 8;
        var ab_i16 = new DataView(arraybuffer, 44);
        var buf_length = ab_i16.byteLength;
        var buf32_length = buf_length / bytes;
        var buffer_i32 = new Int32Array(buf32_length);
        var view = new DataView(buffer_i32.buffer);
        var index = 0;
        for (var j = 0; j < buf_length; j += bytes) {
            view.setInt32(index, decFunc(ab_i16, j), true);
            index += 4;
        }
        return buffer_i32;
    }
    to_string(ui8_data, start, end) {
        return String.fromCharCode.apply(null, ui8_data.subarray(start, end));
    }
    wav_file_processing_check_wav_format(ui8_data) {
        // check: is file a compatible wav-file?
        if ((ui8_data.length < 44) ||
            (this.to_string(ui8_data, 0, 4) != "RIFF") ||
            (this.to_string(ui8_data, 8, 16) != "WAVEfmt ") ||
            (this.to_string(ui8_data, 36, 40) != "data")) {
            console.log("ERROR: wrong format for wav-file.");
            return false;
        }
        return true;
    }
    wav_file_processing_read_parameters(ui8_data) {
        var sample_rate = 0, channels = 0, bps = 0, total_samples = 0, block_align;
        // get WAV/PCM parameters from data / file
        sample_rate = (((((ui8_data[27] << 8) | ui8_data[26]) << 8) | ui8_data[25]) << 8) | ui8_data[24];
        channels = ui8_data[22];
        bps = ui8_data[34];
        block_align = ui8_data[32];
        total_samples = ((((((ui8_data[43] << 8) | ui8_data[42]) << 8) | ui8_data[41]) << 8) | ui8_data[40]) / block_align;
        return {
            sample_rate: sample_rate,
            channels: channels,
            bps: bps,
            total_samples: total_samples,
            block_align: block_align
        };
    }
    encodeFlac(binData, recBuffers, isVerify, isUseOgg) {
        var ui8_data = new Uint8Array(binData);
        var sample_rate=0,
            channels=0,
            bps=0,
            total_samples=0,
            block_align,
            position=0,
            recLength = 0,
            meta_data;
    
        /**
         *  records/saves the output data of libflac-encode method
         */
        function write_callback_fn(buffer, bytes, samples, current_frame){
            recBuffers.push(buffer);
            recLength += bytes;
            // recLength += buffer.byteLength;
        }
    
        function metadata_callback_fn(data){
            console.info('meta data: ', data);
            meta_data = data;
        }
    
        // check: is file a compatible wav-file?
        if (this.wav_file_processing_check_wav_format(ui8_data) == false){
            return {error: 'Wrong WAV file format', status: 0};
        }
    
        // get WAV/PCM parameters from data / file
        var wav_parameters = this.wav_file_processing_read_parameters(ui8_data);
    
        // convert the PCM-Data to the appropriate format for the libflac library methods (32-bit array of samples)
        // creates a new array (32-bit) and stores the 16-bit data of the wav-file as 32-bit data
        var buffer_i32 = this.wav_file_processing_convert_to32bitdata(ui8_data.buffer, wav_parameters.bps);
    
        if(!buffer_i32){
            var msg = 'Unsupported WAV format';
            console.error(msg);
            return {error: msg, status: 1};
        }
    
        var tot_samples = 0;
        var compression_level = 5;
        var flac_ok = 1;
        var is_verify = isVerify;
        var is_write_ogg = isUseOgg;
    
        var flac_encoder = this.Flac.create_libflac_encoder(wav_parameters.sample_rate, wav_parameters.channels, wav_parameters.bps, compression_level, tot_samples, is_verify);
        if (flac_encoder != 0){
            var init_status = this.Flac.init_encoder_stream(flac_encoder, write_callback_fn, metadata_callback_fn, is_write_ogg, 0);
            // @ts-ignore
            flac_ok &= init_status == 0;
            // console.log("flac init: " + flac_ok);
        } else {
            this.Flac.FLAC__stream_encoder_delete(flac_encoder);
            var msg = 'Error initializing the decoder.';
            console.error(msg);
            return {error: msg, status: 1};
        }
    
    
        var isEndocdeInterleaved = true;
        var flac_return;
        if(isEndocdeInterleaved){
    
            //variant 1: encode interleaved channels: TypedArray -> [ch1_sample1, ch2_sample1, ch1_sample1, ch2_sample2, ch2_sample3, ...
    
            flac_return = this.Flac.FLAC__stream_encoder_process_interleaved(flac_encoder, buffer_i32, buffer_i32.length / wav_parameters.channels);
    
        } else {
    
            //variant 2: encode channels array: TypedArray[] -> [ [ch1_sample1, ch1_sample2, ch1_sample3, ...], [ch2_sample1, ch2_sample2, ch2_sample3, ...], ...]
    
            var ch = wav_parameters.channels;
            var len = buffer_i32.length;
            // @ts-ignore
            var channels = new Array(ch).fill(null).map(function(){ return new Uint32Array(len/ch)});
            for(var i=0; i < len; i+=ch){
                for(var j=0; j < ch; ++j){
                    channels[j][i/ch] = buffer_i32[i+j];
                }
            }
    
            flac_return = this.Flac.FLAC__stream_encoder_process(flac_encoder, channels, buffer_i32.length / wav_parameters.channels);
        }
    
        if (flac_return != true){
            console.error("Error: FLAC__stream_encoder_process_interleaved returned false. " + flac_return);
            flac_ok = this.Flac.FLAC__stream_encoder_get_state(flac_encoder);
            this.Flac.FLAC__stream_encoder_delete(flac_encoder);
            return {error: 'Encountered error while encoding.', status: flac_ok};
        }
    
        flac_ok &= this.Flac.FLAC__stream_encoder_finish(flac_encoder);
    
        this.Flac.FLAC__stream_encoder_delete(flac_encoder);
    
        return {metaData: meta_data, status: flac_ok};
    }
}