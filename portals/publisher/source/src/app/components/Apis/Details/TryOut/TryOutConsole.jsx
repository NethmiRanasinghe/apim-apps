/*
 * Copyright (c), WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import 'swagger-ui-react/swagger-ui.css';

import React, {
    Suspense,
    lazy,
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useState,
} from 'react';

import Alert from 'AppComponents/Shared/MuiAlert';
import Api from 'AppData/api';
import withStyles from '@material-ui/core/styles/withStyles';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import CONSTS from 'AppData/Constants';
import CircularProgress from '@material-ui/core/CircularProgress';
import { FormattedMessage } from 'react-intl';
import Grid from '@material-ui/core/Grid';
import LaunchIcon from '@material-ui/icons/Launch';
import { Link } from 'react-router-dom';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Utils from 'AppData/Utils';
import cloneDeep from 'lodash.clonedeep';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAPI } from 'AppComponents/Apis/Details/components/ApiContext';
import { usePublisherSettings } from 'AppComponents/Shared/AppContext';
import { isRestricted } from 'AppData/AuthManager';

// disabled because webpack magic comment for chunk name require to be in the same line
// eslint-disable-next-line max-len
const SwaggerUI = lazy(() => import('AppComponents/Apis/Details/TryOut/SwaggerUI' /* webpackChunkName: "TryoutConsoleSwaggerUI" */));

/**
 * @inheritdoc
 * @param {*} theme theme
 */
const useStyles = makeStyles(() => ({
    centerItems: {
        margin: 'auto',
    },
    tryoutHeading: {
        paddingTop: '20px',
        fontWeight: 400,
        display: 'block',
    },
}));

dayjs.extend(relativeTime);

const tasksReducer = (state, action) => {
    const { name, status } = action;
    // In the case of a key collision, the right-most (last) object's value wins out
    return { ...state, [name]: { ...state[name], ...status } };
};

/**
 * @class TryOutConsole
 * @extends {React.Component}
 */
const TryOutConsole = () => {
    const classes = useStyles();
    const [api] = useAPI();
    const [apiKey, setAPIKey] = useState('');
    const [deployments, setDeployments] = useState([]);
    const [selectedDeployment, setSelectedDeployment] = useState();
    const [oasDefinition, setOasDefinition] = useState();
    const [advAuthHeader, setAdvAuthHeader] = useState('Authorization');
    const [advAuthHeaderValue, setAdvAuthHeaderValue] = useState('');
    const [keyType, setKeyType] = useState('PRODUCTION');
    const { data: publisherSettings } = usePublisherSettings();

    const [tasksStatus, tasksStatusDispatcher] = useReducer(tasksReducer, {
        generateKey: { inProgress: false, completed: false, error: false },
        getOAS: { inProgress: false, completed: false, error: false },
        getDeployments: { inProgress: false, completed: false, error: false },
    });

    const generateInternalKey = useCallback(() => {
        tasksStatusDispatcher({ name: 'generateKey', status: { inProgress: true } });
        Api.generateInternalKey(api.id).then((keyResponse) => {
            const { apikey } = keyResponse.body;
            setAPIKey(apikey);
            tasksStatusDispatcher({ name: 'generateKey', status: { inProgress: false, completed: true } });
        }).catch((error) => tasksStatusDispatcher({ name: 'generateKey', status: { error, inProgress: false } }));
    }, [api.id]);
    useEffect(generateInternalKey, []); // Auto generate API Key on page load
    useEffect(() => {
        tasksStatusDispatcher({ name: 'getDeployments', status: { inProgress: true } });
        if (publisherSettings) {
            api.getDeployedRevisions(api.id).then((deploymentsResponse) => {
                tasksStatusDispatcher({ name: 'getDeployments', status: { inProgress: false, completed: true } });
                const currentDeployments = deploymentsResponse.body;
                const currentDeploymentsWithDisplayName = currentDeployments.map((deploy) => {
                    const gwEnvironment = publisherSettings.environment.find((e) => e.name === deploy.name);
                    const displayName = (gwEnvironment ? gwEnvironment.displayName : deploy.name);
                    return { ...deploy, displayName };
                });
                setDeployments(currentDeploymentsWithDisplayName);
                if (currentDeploymentsWithDisplayName && currentDeploymentsWithDisplayName.length > 0) {
                    const [initialDeploymentSelection] = currentDeploymentsWithDisplayName;
                    setSelectedDeployment(initialDeploymentSelection);
                }
            }).catch(
                (error) => tasksStatusDispatcher({ name: 'getDeployments', status: { inProgress: false, error } }),
            );
            api.getSwagger().then((swaggerResponse) => setOasDefinition(swaggerResponse.body));
        }
    }, [publisherSettings]);

    const isAPIProduct = api.type === 'APIPRODUCT';
    const updatedOasDefinition = useMemo(() => {
        let oasCopy;
        if (selectedDeployment && oasDefinition) {
            const selectedGWEnvironment = publisherSettings.environment
                .find((env) => env.name === selectedDeployment.name);
            let selectedDeploymentVhost = selectedGWEnvironment.vhosts
                .find((vhost) => vhost.host === selectedDeployment.vhost);
            if (!selectedDeploymentVhost) {
                selectedDeploymentVhost = { ...CONSTS.DEFAULT_VHOST, host: selectedDeployment.vhost };
            }
            let pathSeparator = '';
            if (selectedDeploymentVhost.httpContext && !selectedDeploymentVhost.httpContext.startsWith('/')) {
                pathSeparator = '/';
            }
            oasCopy = cloneDeep(oasDefinition); // If not we are directly mutating the state
            if (oasDefinition.openapi) { // Assumed as OAS 3.x definition
                const servers = api.transport.map((transport) => {
                    const transportPort = selectedDeploymentVhost[`${transport}Port`];
                    if (!transportPort) {
                        console.error(`Can't find ${transport}Port `
                            + `in selected deployment ( ${selectedDeploymentVhost.name} )`);
                    }
                    const baseURL = `${transport}://${selectedDeployment.vhost}:${transportPort}`;
                    let url;
                    if (isAPIProduct) {
                        url = `${baseURL}${pathSeparator}`
                            + `${selectedDeploymentVhost.httpContext}${api.context}`;
                    } else {
                        url = `${baseURL}${pathSeparator}`
                            + `${selectedDeploymentVhost.httpContext}${api.context}/${api.version}`
                                .replace('{version}', `${api.version}`);
                    }
                    return { url };
                });
                oasCopy.servers = servers.sort((a, b) => ((a.url > b.url) ? -1 : 1));
            } else { // Assume the API definition is Swagger 2
                let transportPort = selectedDeploymentVhost.httpsPort;
                if (api.transport.length === 1 && !api.transport.includes('https')) {
                    transportPort = selectedDeploymentVhost.httpPort;
                } else if (api.transport.length > 1) {
                    // TODO: fix When both HTTP and HTTPs transports are available can't switch the port between them
                    // ~tmkb
                    console.warn('HTTPS transport port will be used for all other transports');
                }
                const host = `${selectedDeploymentVhost.host}:${transportPort}`;
                let basePath;
                if (isAPIProduct) {
                    basePath = `${pathSeparator}${selectedDeploymentVhost.httpContext}${api.context}`;
                } else {
                    basePath = `${pathSeparator}${selectedDeploymentVhost.httpContext}${api.context}/${api.version}`
                        .replace('{version}', `${api.version}`);
                }
                oasCopy.schemes = api.transport.slice().sort((a, b) => ((a > b) ? -1 : 1));
                oasCopy.basePath = basePath;
                oasCopy.host = host;
            }
        } else if (oasDefinition) {
            // If no deployment just show the OAS definition
            oasCopy = oasDefinition;
        }
        if (oasCopy && api.advertiseInfo && api.advertiseInfo.advertised) {
            if (keyType === 'PRODUCTION') {
                oasCopy.servers = [
                    { url: api.advertiseInfo.apiExternalProductionEndpoint },
                ];
            } else {
                oasCopy.servers = [
                    { url: api.advertiseInfo.apiExternalSandboxEndpoint },
                ];
            }
        }
        return oasCopy;
    }, [keyType, selectedDeployment, oasDefinition, publisherSettings]);

    /**
     *
     * @param {React.SyntheticEventn} event
     */
    const deploymentSelectionHandler = (event) => {
        const selectedGWEnvironment = event.target.value;
        const currentSelection = deployments.find((deployment) => deployment.name === selectedGWEnvironment);
        setSelectedDeployment(currentSelection);
    };
    const decodedJWT = useMemo(() => Utils.decodeJWT(apiKey), [apiKey]);
    const isAPIRetired = api.lifeCycleStatus === 'RETIRED';

    const accessTokenProvider = () => {
        if (api.advertiseInfo && api.advertiseInfo.advertised) {
            return advAuthHeaderValue;
        }
        return apiKey;
    };

    const getAuthorizationHeader = () => {
        if (api.advertiseInfo && api.advertiseInfo.advertised) {
            return advAuthHeader;
        }
        return 'Internal-Key';
    };

    return (
        <>
            <Typography id='itest-api-details-try-out-head' variant='h4' component='h2'>
                <FormattedMessage id='Apis.Details.ApiConsole.ApiConsole.title' defaultMessage='Try Out' />
            </Typography>
            <Paper elevation={0}>
                {(!api.advertiseInfo || !api.advertiseInfo.advertised) ? (
                    <>
                        <Box display='flex' justifyContent='center'>
                            <Grid xs={11} md={6} item>
                                <Typography variant='h5' component='h3' color='textPrimary'>
                                    <FormattedMessage
                                        id='api.console.security.heading'
                                        defaultMessage='Security'
                                    />
                                </Typography>
                                <TextField
                                    fullWidth
                                    label={(
                                        <FormattedMessage
                                            id='Apis.Details.TryOutConsole.token.label'
                                            defaultMessage='Internal API Key'
                                        />
                                    )}
                                    type='password'
                                    value={apiKey}
                                    helperText={decodedJWT ? (
                                        <Box color='success.main'>
                                            {`Expires ${dayjs.unix(decodedJWT.payload.exp).fromNow()}`}
                                        </Box>
                                    ) : 'Generate or provide an internal API Key'}
                                    margin='normal'
                                    variant='outlined'
                                    name='internal'
                                    multiline
                                    rows={4}
                                    onChange={(e) => setAPIKey(e.target.value)}
                                    disabled={isAPIRetired}
                                />
                                <Button
                                    onClick={generateInternalKey}
                                    variant='contained'
                                    color='primary'
                                    disabled={tasksStatus.generateKey.inProgress || isAPIRetired
                                    || isRestricted(['apim:api_create', 'apim:api_publish'], api)}
                                >
                                    <FormattedMessage
                                        id='Apis.Details.ApiConsole.generate.test.key'
                                        defaultMessage='Generate Key'
                                    />
                                </Button>
                                {tasksStatus.generateKey.inProgress
                                && (
                                    <Box
                                        display='inline'
                                        position='absolute'
                                        mt={1}
                                        ml={-8}
                                    >
                                        <CircularProgress size={24} />
                                    </Box>
                                )}
                            </Grid>
                        </Box>
                        <Box my={3} display='flex' justifyContent='center'>
                            <Grid xs={11} md={6} item>
                                {(tasksStatus.getDeployments.completed && !deployments.length && !isAPIRetired) && (
                                    <Alert variant='outlined' severity='error'>
                                        <FormattedMessage
                                            id='Apis.Details.ApiConsole.deployments.no'
                                            defaultMessage={'{artifactType} is not deployed yet! Please deploy '
                                            + 'the {artifactType} before trying out'}
                                            values={{ artifactType: api.isRevision ? 'Revision' : 'API' }}
                                        />
                                        <Link to={'/apis/' + api.id + '/deployments'}>
                                            <LaunchIcon
                                                color='primary'
                                                fontSize='small'
                                            />
                                        </Link>
                                    </Alert>
                                )}
                                {isAPIRetired && (
                                    <Alert variant='outlined' severity='error'>
                                        <FormattedMessage
                                            id='Apis.Details.ApiConsole.deployments.isAPIRetired'
                                            defaultMessage='Can not Try Out retired APIs!'
                                        />
                                    </Alert>
                                )}
                                {((deployments && deployments.length > 0))
                                && (
                                    <>
                                        <Typography
                                            variant='h5'
                                            component='h3'
                                            color='textPrimary'
                                        >
                                            <FormattedMessage
                                                id='Apis.Details.ApiConsole.deployments.api.gateways'
                                                defaultMessage='API Gateways'
                                            />
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            select
                                            label={(
                                                <FormattedMessage
                                                    defaultMessage='Environment'
                                                    id='Apis.Details.ApiConsole.environment'
                                                />
                                            )}
                                            value={(selectedDeployment && selectedDeployment.name) || ''}
                                            name='selectedEnvironment'
                                            onChange={deploymentSelectionHandler}
                                            margin='normal'
                                            variant='outlined'
                                            SelectProps={{
                                                MenuProps: {
                                                    anchorOrigin: {
                                                        vertical: 'bottom',
                                                        horizontal: 'left',
                                                    },
                                                    getContentAnchorEl: null,
                                                },
                                            }}
                                        >
                                            {deployments.map((deployment) => (
                                                <MenuItem
                                                    value={deployment.name}
                                                    key={deployment.name}
                                                >
                                                    {deployment.displayName}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </>
                                )}
                            </Grid>
                        </Box>
                    </>
                ) : (
                    <>
                        <Box display='flex' justifyContent='center'>
                            <Grid x={12} md={6} className={classes.centerItems}>
                                <Typography
                                    variant='h6'
                                    component='label'
                                    id='key-type'
                                    color='textSecondary'
                                    className={classes.tryoutHeading}
                                >
                                    <FormattedMessage
                                        id='Apis.Details.ApiConsole.select.key.type.heading'
                                        defaultMessage='Key Type'
                                    />
                                </Typography>
                                <FormControl component='fieldset'>
                                    <RadioGroup
                                        name='selectedKeyType'
                                        value={keyType}
                                        onChange={(event) => { setKeyType(event.target.value); }}
                                        aria-labelledby='key-type'
                                        row
                                    >
                                        <FormControlLabel
                                            value='PRODUCTION'
                                            control={<Radio />}
                                            disabled={api.advertiseInfo && api.advertiseInfo.advertised
                                            && !api.advertiseInfo.apiExternalProductionEndpoint}
                                            label={(
                                                <FormattedMessage
                                                    id='Apis.Details.ApiConsole.production.radio'
                                                    defaultMessage='Production'
                                                />
                                            )}
                                        />
                                        <FormControlLabel
                                            value='SANDBOX'
                                            control={<Radio />}
                                            disabled={api.advertiseInfo && api.advertiseInfo.advertised
                                            && !api.advertiseInfo.apiExternalSandboxEndpoint}
                                            label={(
                                                <FormattedMessage
                                                    id='Apis.Details.ApiConsole.sandbox.radio'
                                                    defaultMessage='Sandbox'
                                                />
                                            )}
                                        />
                                    </RadioGroup>
                                </FormControl>
                            </Grid>
                        </Box>
                        <Box display='flex' justifyContent='center'>
                            <Grid container spacing={2} x={8} md={6} direction='row'>
                                <Grid xs={6} md={4} item>
                                    <TextField
                                        margin='normal'
                                        variant='outlined'
                                        id='advAuthHeader'
                                        label={(
                                            <FormattedMessage
                                                id='Apis.Details.ApiConsole.adv.auth.header'
                                                defaultMessage='Authorization Header'
                                            />
                                        )}
                                        name='advAuthHeader'
                                        onChange={(event) => { setAdvAuthHeader(event.target.value); }}
                                        value={advAuthHeader || ''}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid xs={6} md={8} item>
                                    <TextField
                                        margin='normal'
                                        variant='outlined'
                                        id='advAuthHeaderValue'
                                        label={(
                                            <FormattedMessage
                                                id='Apis.Details.ApiConsole.adv.auth.header.value'
                                                defaultMessage='Authorization Header Value'
                                            />
                                        )}
                                        name='advAuthHeaderValue'
                                        onChange={(event) => { setAdvAuthHeaderValue(event.target.value); }}
                                        value={advAuthHeaderValue || ''}
                                        fullWidth
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </>
                )}
                {updatedOasDefinition ? (
                    <Suspense
                        fallback={(
                            <CircularProgress />
                        )}
                    >
                        <SwaggerUI
                            api={api}
                            accessTokenProvider={accessTokenProvider}
                            spec={updatedOasDefinition}
                            authorizationHeader={getAuthorizationHeader()}
                        />
                    </Suspense>
                ) : <CircularProgress />}
            </Paper>
        </>
    );
};
TryOutConsole.propTypes = {
    classes: PropTypes.shape({
        paper: PropTypes.string.isRequired,
        titleSub: PropTypes.string.isRequired,
        grid: PropTypes.string.isRequired,
        userNotificationPaper: PropTypes.string.isRequired,
        buttonIcon: PropTypes.string.isRequired,
        lcState: PropTypes.shape({}).isRequired,
        theme: PropTypes.shape({}).isRequired,
        intl: PropTypes.shape({
            formatMessage: PropTypes.func,
        }).isRequired,
    }).isRequired,
};

export default withStyles(makeStyles)(TryOutConsole);
