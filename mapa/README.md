# Phaser 3 with TypeScript and Webpack

A simple game with Phaser, TypeScript and Webpack playable here: https://mizar999.github.io/phaser-typescript-webpack/

## Resources

- [How to build a simple game in the browser with Phaser 3 and TypeScript](https://medium.freecodecamp.org/how-to-build-a-simple-game-in-the-browser-with-phaser-3-and-typescript-bdc94719135) by Mariya Davydova [@mariyadavydova](https://www.freecodecamp.org/news/author/mariya/)

## Assets

- [Simple Space](https://www.kenney.nl/assets/simple-space) by [Kenney](https://www.kenney.nl/)

## Development

If you want to develop the project further, the following commands should be sufficient:

```powershell
git clone https://github.com/Mizar999/phaser-typescript-webpack.git
npm install
```

## New Phaser project - Setup

- Init npm and install necessary packages

    ```powershell
    npm init -y
    npm install --save-dev typescript@4.9.4 ts-loader@9.4.2 webpack@5.75.0 webpack-cli@5.0.1 phaser@3.55.2 http-server@14.1.1 concurrently@7.6.0
    ```
- Create **Webpack** configuration `webpack.config.js`:

    ```javascript
    const path = require('path');

    module.exports = {
    entry: './src/app.ts',
    module: {
        rules:[{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'dist')
    },
    mode: 'development'
    };
    ```

- Webpack will get the sources from `src/app.ts` and collect everything in `dist/app.js` file
- Create **TypeScript** configuration `tsconfig.json`:

    ```json
    {
        "compilerOptions": {
            "target": "es5"
        },
        "include": [
            "src/*"
        ]
    }
    ```

- Download the [Phaser 3 definitions](https://github.com/photonstorm/phaser/tree/master/types) into the `src` subdirectory (`src/phaser.d.ts`)
- Update the **scripts**-section of the `package.json` file. The nra script can be used if the npm packages were locally installed:

    ```json
    "scripts": {
        "build": "webpack",
        "watch": "webpack --watch",
        "serve": "http-server --port=8085 -c-1"
    }
    ```

- To build the application run:

    ```powershell
    npm run-script build
    ```

- To run multiple npm scripts cross platform in parallel run the following command:

    ```powershell
    # if globally installed
    concurrently npm:watch npm:serve

    # if locally installed
    npx concurrently npm:watch npm:serve
    ```
