import * as Vosk from 'vosk-browser';

export type VoiceStatus = 'OFFLINE' | 'LOADING' | 'READY' | 'LISTENING' | 'PROCESSING' | 'ERROR';

class VoiceCommandService {
    private model: any = null;
    private recognizer: any = null;
    private mediaStream: MediaStream | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private audioContext: AudioContext | null = null;

    // Callbacks
    private onResultCallback: ((text: string) => void) | null = null;
    private onStatusChangeCallback: ((status: VoiceStatus, message?: string) => void) | null = null;

    private status: VoiceStatus = 'OFFLINE';

    constructor() {
        // Singleton initialization if needed
    }

    public setCallbacks(
        onResult: (text: string) => void,
        onStatus: (status: VoiceStatus, message?: string) => void
    ) {
        this.onResultCallback = onResult;
        this.onStatusChangeCallback = onStatus;
    }

    private setStatus(status: VoiceStatus, message?: string) {
        this.status = status;
        if (this.onStatusChangeCallback) {
            this.onStatusChangeCallback(status, message);
        }
    }

    public async loadModel(modelPath: string = '/model.tar.gz') {
        if (this.model) {
            this.setStatus('READY');
            return;
        }

        try {
            this.setStatus('LOADING', 'Loading Voice Model...');
            const model = await Vosk.createModel(modelPath);
            model.setLogLevel(0); // Updates
            this.model = model;

            const recognizer = new model.KaldiRecognizer(16000);

            recognizer.on("result", (mn: any) => {
                if (mn.result && mn.result.text) {
                    const text = mn.result.text;
                    if (text && this.onResultCallback) {
                        this.onResultCallback(text);
                    }
                }
            });

            this.recognizer = recognizer;
            this.setStatus('READY');
        } catch (error: any) {
            console.error("Vosk Load Error:", error);
            this.setStatus('ERROR', error.message);
        }
    }

    public async startListening() {
        if (!this.model || !this.recognizer) {
            console.warn("Model not loaded");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            this.mediaStream = stream;

            this.audioContext = new AudioContext({ sampleRate: 16000 });
            this.source = this.audioContext.createMediaStreamSource(stream);

            // Web Audio Processor (Deprecated but works reliably for Vosk-browser currently)
            const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
                if (this.status !== 'LISTENING') return;

                if (this.recognizer) {
                    this.recognizer.acceptWaveform(e.inputBuffer);
                }
            };

            this.source.connect(processor);
            processor.connect(this.audioContext.destination);

            this.setStatus('LISTENING');
        } catch (e: any) {
            console.error("Mic Error:", e);
            this.setStatus('ERROR', "Microphone access denied or error");
        }
    }

    public stopListening() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(t => t.stop());
            this.mediaStream = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.setStatus('READY');
    }

    public cleanup() {
        this.stopListening();
        if (this.model) {
            this.model.terminate();
        }
    }
}

export const voiceCommandService = new VoiceCommandService();
