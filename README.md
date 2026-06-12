# ![](./public/favicon.svg) **goboscript IDE**

![](https://u.cubeupload.com/aspizu/Screenshot20250529at.png)

[**Launch goboscript IDE**](https://aspiz.uk/goboscript.ide/)

Code editor with integrated project player for creating goboscript projects quickly.

#### Built with
 - [**goboscript**](https://github.com/aspizu/goboscript)
 - [**TurboWarp Scaffolding**](https://github.com/TurboWarp/scaffolding)
 - [**Monaco Editor**](https://github.com/microsoft/monaco-editor)

goboscript IDE is a React application that uses [`wasm-pack`](https://github.com/rustwasm/wasm-pack) to run the goboscript compiler in the browser.

## Contributing

Pull Requests are appreciated.

Clone the repository and build goboscript using `wasm-pack`.

```shell
git clone https://github.com/aspizu/goboscript
cd goboscript
wasm-pack build --release
cd ..
bun install
bun run dev
```

