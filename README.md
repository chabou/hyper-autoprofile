# hyper-autoprofile
Extension for [Hyper.app](https://hyper.is) to configure terminal appearance according to current shell prompt

## Install

To install, edit `~/.hyper.js` and add `"hyper-autoprofile"` to `plugins`:

```
plugins: [
  "hyper-autoprofile",
], 
```
## Configuration
Add `overlay` in your `~/.hyper.js` config.
The configuration below shows the two differents sections : `prompts` and `profiles` :

```js
module.exports = {
  config: {
    // other configs...
    autoProfile: {
      prompts: [{
          // 'MyHost:~ me$ ' default MacOS bash prompt
          pattern: '^(\\S+):([/~].*) ([a-z_][a-z0-9_\\-\\.]*[\\$]?)[\\$#]\\s*$',
          hostname: 1,
          path: 2,
          username: 3
        },{
          // 'me@MyHost:~$ ' default Linux bash prompt
          pattern: '^([a-z_][a-z0-9_\\-\\.]*[\\$]?)@(\\S+):([\\/~].*)[\\$#]\\s*$',
          username: 1,
          hostname: 2,
          path: 3
        }
      ],
      profiles: [{
          triggers: [
            'root@',
          ],
          backgroundColor: '#400'
        },
        {
          triggers: [
            '@scotchbox'
          ],
          backgroundColor: '#040'
        },
        {
          triggers: [
            '/project'
          ],
          backgroundColor: '#004'
        }
      ],
      stripAnsiColors: true //default
    }
  }
  //...
};
```
### autoProfile.prompts

This section defines different pattern for parsing prompt components : username, host, path.

For example, define a pattern for MacOS bash default prompt :
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

`user` and `host` components are strictly compared, `path` matches if it is included in prompt path. `'/tmp'` path will match `'/tmp'` and `'/path/to/tmp/subpath'`.

All other properties of this section will be applied to Term if a trigger is matched. It could be any property of the main config section like `backgroundColor`, `cursorColor`, `fontSize`...

### autoProfile.stripAnsiColors (Default: true)
If enabled, ANSI escape sequences are stripped from input before trying to match triggers.
See [here](http://ascii-table.com/ansi-escape-sequences.php) for more details.

## Caveat

Because of some tricky parsing, this plugin could not detect a shell change immediately. To force its detection, clearing terminal (`Ctrl+L`) could help.

## Licence

[MIT](LICENSE.md)
