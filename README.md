# hyper-autoprofile

[![CI Status](https://circleci.com/gh/chabou/hyper-autoprofile.svg?style=shield)](https://circleci.com/gh/chabou/hyper-autoprofile)
[![NPM version](https://badge.fury.io/js/hyper-autoprofile.svg)](https://www.npmjs.com/package/hyper-autoprofile)
![Downloads](https://img.shields.io/npm/dm/hyper-autoprofile.svg?style=flat)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

Extension for [Hyper.app](https://hyper.is) to configure terminal appearance according to current shell prompt.

![AutoProfile Demo](https://cloud.githubusercontent.com/assets/4137761/21533214/9028bf06-cd58-11e6-9086-2546a7f5563b.gif)

## Install

### Using [hpm](https://github.com/zeit/hpm)

```
hpm install hyper-autoprofile
```

### Manually

To install, edit `~/.hyper.js` and add `"hyper-autoprofile"` to `plugins`:

```
plugins: [
  "hyper-autoprofile",
],
```

## Configuration

Add `autoProfile` in your `~/.hyper.js` config.
The configuration below shows the two differents sections `prompts` and `profiles`:

```js
module.exports = {
  config: {
    // other configs...
    autoProfile: {
      prompts: [
        {
          // 'MyHost:Documents me$ ' default MacOS bash prompt
          pattern: "^(\\S+):(.*) ([a-z_][a-z0-9_\\-\\.]*[\\$]?)[\\$#]\\s*$",
          hostname: 1,
          path: 2,
          username: 3
        },
        {
          // 'me@MyHost:~$ ' default Linux bash prompt
          pattern:
            "^([a-z_][a-z0-9_\\-\\.]*[\\$]?)@(\\S+):([\\/~].*)[\\$#]\\s*$",
          username: 1,
          hostname: 2,
          path: 3
        },
        {
          // 'me@MyHost ~> ' default fish prompt
          pattern: "^([a-z_][a-z0-9_\\-\\.]*[\\$]?)@(\\S+) ([\\/~].*)[>#]\\s*",
          username: 1,
          hostname: 2,
          path: 3
        },
        {
          // 'MyHost% ' default zsh prompt
          pattern: "^(\\S+)% ",
          hostname: 1
        },
        {
          // '➜  ~' default oh-my-zsh prompt (robbyrussell theme)
          pattern: "^➜  ([\\/~].*) ",
          path: 1
        },
        {
          // 'me@MyHost MINGW64 ~ (master) ' default git-bash prompt on Windows
          pattern: "^([a-z_][a-z0-9_\\-\\.]*[\\$]?)@(\\S+) MINGW64 ([\\/~].*)(\s|$)",
          username: 1,          
          hostname: 2,          
          path: 3        
        }
      ],
      profiles: [
        {
          triggers: ["root@"],
          backgroundColor: "#400"
        },
        {
          triggers: ["@scotchbox"],
          backgroundColor: "#040"
        },
        {
          triggers: ["/project"],
          backgroundColor: "#004"
        }
      ],
      stripAnsiColors: true, //default
      debug: false //default
    }
  }
  //...
};
```

### autoProfile.prompts

This section defines different patterns for parsing prompt components: username, host, path.

For example, define a pattern for MacOS bash default prompt:

```
{
  // 'MyHost:~ me$ '
  pattern: '^(\\S+):([/~].*) ([a-z_][a-z0-9_\\-\\.]*[\\$]?)[\\$#]\\s*$',
  hostname: 1,
  path: 2,
  username: 3
}
```

### autoProfile.profiles

This section is an ordered array of potential Profile. A Profile is composed by a list of `trigger` and style properties.
`trigger` formats :

* `'user@'` to specify `user`
* `'@host'` to specify `host`
* `'/path/to/directory'` or `'/directory'` to specify `path`
* `'user@host'` to specify `user` and `host`
* `'user@:/path'` to specify `user` and `path`
* `'@host:/path'` to specify `host` and `path`
* `'user@host:/path'` to specify `user` and `host` and `path`

`user` and `host` components are strictly compared, `path` matches if it is included in prompt path: `'/tmp'` path will match `'/tmp'` and `'/path/to/tmp/subpath'`.

All other properties of this section will be applied to Term if a trigger is matched. It could be any property of the main config section like `backgroundColor`, `cursorColor`, `fontSize`...

### autoProfile.stripAnsiSequences (Default: true)

If enabled, ANSI escape sequences are stripped from input before trying to match triggers.
See [here](http://ascii-table.com/ansi-escape-sequences-vt-100.php) for more details.

### autoProfile.debug (Default: false)

If enabled, debug informations are written to console

## Caveat

Because of some tricky parsing, this plugin could not detect a shell change immediately. To force its detection, clearing terminal (`Ctrl+L`) could help.

## Licence

[MIT](LICENSE.md)
