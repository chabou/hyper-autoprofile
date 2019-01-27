let debug_enabled_ = false;

const debug = function() {
  if (debug_enabled_) {
    [].unshift.call(arguments, '|AUTOPROFILE|');
    console.log.apply(this, arguments);
  }
};

const getPromptInfos = function(prompts, data) {
  let result;
  debug('getPromptInfos: looking for prompt in "' + data + '" -> "' + encodeURI(data) + "'");
  prompts.forEach(prompt => {
    if (result || !prompt.pattern || prompt.pattern.length === 0) {
      return;
    }
    const pattern = new RegExp(prompt.pattern, 'gm');
    const matches = pattern.exec(data);
    if (matches && matches.length > 0) {
      // Pattern has matched, now extract infos
      const {username, hostname, path} = prompt;
      result = {
        username: username ? matches[username] : undefined,
        hostname: hostname ? matches[hostname] : undefined,
        path: path ? matches[path] : undefined
      };
    }
  });
  if (result) {
    debug('getPromptInfos: found', result);
  }
  return result;
};

const getProfile = function(profiles, infos) {
  let result;
  profiles.forEach(profile => {
    if (result || !profile.triggers || profile.triggers.length === 0) {
      return;
    }
    let match = false;
    profile.triggers.forEach(trigger => {
      if (match) {
        return;
      }
      debug('getProfile: testing trigger', trigger);
      const keys = Object.keys(trigger);
      for (let i = 0; i < keys.length; i += 1) {
        let key = keys[i];
        if (key === 'path' && infos[key]) {
          if (infos[key].indexOf(trigger[key]) === -1) {
            return;
          }
        } else if (trigger[key] !== infos[key]) {
          return;
        }
      }
      match = true;
    });
    if (match) {
      result = profile;
      debug('getProfile: match for profile', profile);
    }
  });

  return result;
};

const newline = {};

exports.middleware = store => next => action => {
  if (action.type === 'SESSION_PTY_DATA') {
    let {data, uid} = action;
    data = data.replace(/[\n\r]?.*\033\[2J/gm, '\n'); // Remove all char before ANSI sequence to erase line 'ESC[2J'
    data = data.replace(/[\n\r]?.*\033\[J/gm, '\n'); // Remove all char before ANSI sequence to erase line 'ESC[J'
    data = data.replace(/.*\033\[[12]K/gm, ''); // Remove all char before ANSI sequence to erase line 'ESC[2K'
    data = data.replace(/\033\[K.*/gm, ''); //Remove all char after ANSI sequence to erase end on line
    data = data.replace(/\033\]0.*?\007/gm, ''); // Remove ANSI sequence trick to set xterm title

    // Parse data only if it is a new line or if it contains a line beginning
    if (
      !newline[uid] &&
      data.indexOf('\n') === -1 &&
      data.indexOf('\r') === -1 &&
      data.indexOf('\x1b[?1034h') === -1 && // After a sudo
      data.indexOf('\x1b[K') === -1 && // ANSI sequence to erase a line
      data.indexOf('\x1b[2J') === -1 && // ANSI sequence to erase display
      data.indexOf('\x1b[J') === -1
    ) {
      // ANSI sequence to erase display
      return next(action);
    }

    // If there is a '\n' or '\r' at the end of line, next data is a newline
    const lastChar = data.charAt(data.length - 1);
    newline[uid] = lastChar === '\n' || lastChar === '\r';

    const config = store.getState().ui.autoProfile ? store.getState().ui.autoProfile.config : {};
    if (!config || !config.prompts || config.prompts.length === 0) {
      console.warn('hyper-autoprofile enabled but no prompt config found');
      return next(action);
    }

    if (config.stripAnsiSequences !== false) {
      data = data.replace(/\033\[[0-9;]*m/gm, ''); //Color ESC[0;1m
      data = data.replace(/\033[()][AB0-2;]/gm, ''); //Font ESC(B and ESC)B
    }
    const promptInfos = getPromptInfos(config.prompts, data);
    if (!promptInfos) {
      return next(action);
    }
    const profile = getProfile(config.profiles, promptInfos);
    store.dispatch({
      type: 'AUTOPROFILE_SET',
      uid,
      profile: profile ? profile.style : undefined
    });
  }
  next(action);
};

const parseTrigger = function(trigger) {
  const result = {};
  const idxAt = trigger.indexOf('@');
  const idxColon = trigger.indexOf(':');

  // username
  if (idxAt > 0) {
    result.username = trigger.substr(0, idxAt);
  }
  // hostname
  if (idxAt >= 0 && idxAt < trigger.length - 1) {
    result.hostname = trigger.substr(idxAt + 1, (idxColon >= 0 ? idxColon : trigger.length) - idxAt - 1);
  }
  // path
  if (idxAt === -1 || (idxColon >= 0 && idxColon < trigger.length - 1)) {
    result.path = trigger.substr(idxColon + 1, trigger.length - idxColon - 1);
  }

  return result;
};

function formatConfiguration(autoProfileConfig) {
  const formattedConfig = {};

  if (!autoProfileConfig || !autoProfileConfig.prompts || !autoProfileConfig.profiles) {
    return formattedConfig;
  }
  formattedConfig.debug = autoProfileConfig.debug;
  formattedConfig.stripAnsiSequences = autoProfileConfig.stripAnsiSequences;
  formattedConfig.prompts = autoProfileConfig.prompts;
  const profiles = [];
  autoProfileConfig.profiles.forEach(profile => {
    const formattedProfile = {triggers: [], style: {}};
    if (!profile.triggers || profile.triggers.length === 0) {
      return;
    }
    profile.triggers.forEach(trigger => {
      const criteria = parseTrigger(trigger);
      if (!criteria || criteria.length === 0) {
        return;
      }
      formattedProfile.triggers.push(criteria);
    });
    formattedProfile.style = Object.assign({}, profile);
    delete formattedProfile.style.triggers;
    profiles.push(formattedProfile);
  });
  formattedConfig.profiles = profiles;
  return formattedConfig;
}

exports.reduceUI = (state, action) => {
  switch (action.type) {
    case 'CONFIG_LOAD':
    case 'CONFIG_RELOAD': {
      const config = formatConfiguration(action.config.autoProfile);
      debug_enabled_ = config.debug || false;
      debug('config loaded:', JSON.stringify(config));
      return state.set('autoProfile', {config: config, sessions: {}});
    }
    case 'AUTOPROFILE_SET': {
      return state.setIn(['autoProfile', 'sessions', action.uid], action.profile);
    }
    default:
      return state;
  }
};

exports.mapTermsState = (state, map) => {
  if (!state.ui.autoProfile || !state.ui.autoProfile.sessions) {
    return map;
  }
  return Object.assign({}, map, {profiles: state.ui.autoProfile.sessions});
};

exports.getTermGroupProps = (uid, parentProps, props) => {
  return Object.assign({}, props, {profiles: parentProps.profiles});
};

exports.getTermProps = (uid, parentProps, props) => {
  const {profiles} = parentProps;
  if (!profiles) {
    return props;
  }
  const profileProps = Object.assign({}, profiles[uid]);

  if (profileProps.backgroundColor) {
    // Weird trick because backgroundColor property is explicitly not forwarded to Term in Hyper.app
    profileProps.customCSS = `body { background-color: ${profileProps.backgroundColor}; }`;
  }
  return Object.assign({}, props, profileProps);
};
