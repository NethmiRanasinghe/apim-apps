/**
 * Copyright (c)  WSO2 Inc. (http://wso2.com) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useContext } from 'react';

import { styled } from '@mui/material/styles';

import {
    Icon,
    IconButton,
    InputAdornment,
    TextField,
} from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { isRestricted } from 'AppData/AuthManager';
import APIContext from 'AppComponents/Apis/Details/components/ApiContext';

const PREFIX = 'GenericEndpointAdd';

const classes = {
    endpointInputWrapper: `${PREFIX}-endpointInputWrapper`,
    textField: `${PREFIX}-textField`,
    input: `${PREFIX}-input`,
    iconButton: `${PREFIX}-iconButton`
};

const Root = styled('div')((
    {
        theme
    }
) => ({
    [`&.${classes.endpointInputWrapper}`]: {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
    },

    [`& .${classes.textField}`]: {
        width: '100%',
    },

    [`& .${classes.input}`]: {
        marginLeft: theme.spacing(1),
        flex: 1,
    },

    [`& .${classes.iconButton}`]: {
        padding: theme.spacing(1),
    }
}));

/**
 * This component represents the view and functions of endpoint add.
 *
 * @param {any} props The input props.
 * @returns {any} HTML representation of the component.
 * */
function GenericEndpointAdd(props) {
    const {
        addEndpoint,
        endpointType,
        category,
    } = props;
    const [serviceUrl, setServiceUrl] = useState('');
    const { api } = useContext(APIContext);
    const intl = useIntl();

    /**
     * The method to handle endpoint add button click action.
     * */
    const onAddEndpoint = () => {
        setServiceUrl('');
        addEndpoint(serviceUrl);
    };

    return (
        <Root className={classes.endpointInputWrapper}>
            <TextField
                label={(
                    <FormattedMessage
                        id='Apis.Details.Endpoints.GenericEndpoint.service.url.input'
                        defaultMessage='Service URL'
                    />
                )}
                disabled={isRestricted(['apim:api_create'], api)}
                className={classes.textField}
                value={serviceUrl}
                fullWidth
                onChange={(event) => setServiceUrl(event.target.value)}
                variant='outlined'
                margin='normal'
                placeholder={intl.formatMessage({
                    id: 'Apis.Details.Endpoints.GenericEndpoint.service.url.input.placeholder',
                    defaultMessage: 'Enter the Endpoint URL and press + button',
                })}
                InputProps={{
                    id: category + '-' + endpointType,
                    endAdornment: (
                        <InputAdornment position='end'>
                            <IconButton
                                onClick={onAddEndpoint}
                                color='green'
                                className={classes.iconButton}
                                aria-label='Search'
                                disabled={serviceUrl === ''}
                                id={category + '-' + endpointType + '-add-btn'}
                                size='large'>
                                <Icon>
                                    add
                                </Icon>
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
        </Root>
    );
}

GenericEndpointAdd.propTypes = {
    classes: PropTypes.shape({}).isRequired,
    addEndpoint: PropTypes.func.isRequired,
    endpointType: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
};

export default (GenericEndpointAdd);
