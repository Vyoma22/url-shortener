import React from "react";
import { nanoid } from "nanoid";
import { getDatabase, child, ref, set, get } from "firebase/database";
import { isWebUri } from "valid-url";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { QRCodeCanvas } from 'qrcode.react';

class Form extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            longURL: '',
            preferedAlias: '',
            generatedURL: '',
            loading: false,
            errors: [],
            errorMessage: {},
            toolTipMessage: 'Copy to clipboard'
        };
    }
    onSubmit = async (event) => {
        event.preventDefault();
        this.setState({
            loading: true,
            generatedURL: ''
        })

        var isFormValid = await this.validateInput()
        if (!isFormValid) {
            return
        }

        var generatedKey = nanoid(5);
        var generatedURL = "URLitMini.com/" + generatedKey;

        if (this.state.preferedAlias !== '') {
            generatedKey = this.state.preferedAlias
            generatedURL = "URLitMini.com/" + this.state.preferedAlias
        }
        const db = getDatabase();
        console.log("Writing to Firebase:", {
            generatedKey: generatedKey,
            longURL: this.state.longURL,
            preferedAlias: this.state.preferedAlias,
            generatedURL: generatedURL
        });
        set(ref(db, '/' + generatedKey), {
            generatedKey: generatedKey,
            longURL: this.state.longURL,
            preferedAlias: this.state.preferedAlias,
            generatedURL: generatedURL
        }).then(() => {
            this.setState({
                generatedURL: generatedURL,
                loading: false
            });
        }).catch((error) => {
            console.error("Error writing to Firebase:", error);
            this.setState({ loading: false });
        });
    };

    hasError = (key) => {
        return this.state.errors.indexOf(key) !== -1;
    }

    handleChange = (e) => {
        const { id, value } = e.target
        this.setState(prevState => ({
            ...prevState,
            [id]: value
        }))
    }
    validateInput = async () => {
        var errors = [];
        var errorMessages = this.state.errorMessage

        if (this.state.longURL.length === 0) {
            errors.push("longURL");
            errorMessages['longURL'] = 'Please enter your URL!';
        } else if (!isWebUri(this.state.longURL)) {
            errors.push("longURL");
            errorMessages['longURL'] = 'Please a URL in the form of https://www....';
        }

        if (this.state.preferedAlias !== '') {
            if (this.state.preferedAlias.length > 7) {
                errors.push("suggestedAlias");
                errorMessages['suggestedAlias'] = 'Please Enter an Alias less than 7 Characters';
            } else if (this.state.preferedAlias.indexOf(' ') >= 0) {
                errors.push("suggestedAlias");
                errorMessages['suggestedAlias'] = 'Spaces are not allowed in URLS';
            }

            var keyExists = await this.checkKeyExists()

            if (keyExists.exists()) {
                errors.push("suggestedAlias");
                errorMessages['suggestedAlias'] = 'The Alias already exists! Please enter another one';
            }
        }

        this.setState({
            errors: errors,
            errorMessages: errorMessages,
            loading: false
        });

        if (errors.length > 0) {
            return false;
        }

        return true;
    }

    checkKeyExists = async () => {
        const dbRef = ref(getDatabase());
        return get(child(dbRef, `/${this.state.preferedAlias}`)).catch((error) => {
            return false
        });
    }

    copyToClipBoard = () => {
        navigator.clipboard.writeText(this.state.generatedURL)
        this.setState({
            toolTipMessage: 'Copied!'
        })
    }

    render() {
        return (
            <div className="container">
                <div className="form-and-qr d-flex">
                    <form autoComplete="off" style={{ flex: 1 }}>
                        <h3>URLitMini</h3>
                        <div className="form-group">
                            <label>Enter Your Long URL</label>
                            <input
                                id="longURL"
                                onChange={this.handleChange}
                                value={this.state.longURL}
                                type="url"
                                required
                                className={
                                    this.hasError("longURL")
                                        ? "form-control is-invalid"
                                        : "form-control"
                                }
                                placeholder="https://www..."
                            />
                        </div>
                        <div
                            className={
                                this.hasError("longURL") ? "text-danger" : "visually-hidden"
                            }
                        >
                            {this.state.errorMessage.longURL}
                        </div>

                        <div className="form-group">
                            <label htmlFor="basic-url">Your URLitMini</label>
                            <div className="input-group mb-3">
                                <div className="input-group-prepend">
                                    <span className="input-group-text">URLitMini/</span>
                                </div>
                                <input
                                    id="preferedAlias"
                                    onChange={this.handleChange}
                                    value={this.state.preferedAlias}
                                    className={
                                        this.hasError("preferedAlias")
                                            ? "form-control is-invalid"
                                            : "form-control"
                                    }
                                    type="text" placeholder="eg. bjgU5 (Optional)"
                                />
                            </div>
                            <div
                                className={
                                    this.hasError("preferedAlias") ? "text-danger" : "visually-hidden"
                                }
                            >
                                {this.state.errorMessage.suggestedAlias}
                            </div>
                        </div>


                        <button className="btn btn-primary" type="button" onClick={this.onSubmit}>
                            {
                                this.state.loading ?
                                    <div>
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    </div> :
                                    <div>
                                        <span className="visually-hidden spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        <span>Generate URLitMini</span>
                                    </div>
                            }

                        </button>

                        {
                            this.state.generatedURL === '' ?
                                <div></div>
                                :
                                <div className="generatedurl">
                                    <span>Your generated URL is: </span>
                                    <div className="input-group mb-3">
                                        <input disabled type="text" value={this.state.generatedURL} className="form-control" />
                                        <div className="input-group-append">
                                            <OverlayTrigger
                                                key={'top'}
                                                placement={'top'}
                                                overlay={
                                                    <Tooltip id={`tooltip-${'top'}`}>
                                                        {this.state.toolTipMessage}
                                                    </Tooltip>
                                                }
                                            >
                                                <button onClick={this.copyToClipBoard} className="btn btn-outline-secondary" type="button">
                                                    Copy
                                                </button>
                                            </OverlayTrigger>
                                        </div>
                                    </div>
                                </div>
                        }

                    </form>
                    {
                        this.state.generatedURL !== '' &&
                        <div className="qr-container d-flex justify-content-center align-items-center" style={{ marginLeft: '30px' }}>
                            <QRCodeCanvas
                                value={this.state.generatedURL.startsWith('http') ? this.state.generatedURL : `https://${this.state.generatedURL}`}
                                size={220} // adjust size here
                            />
                        </div>
                    }
                </div>
            </div>
        );
    }
}

export default Form;