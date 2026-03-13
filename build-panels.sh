set -e

WASM_FILE="src/check-watch-panel/public/main.wasm"
WASM_URL="https://github.com/authzed/spicedb/releases/download/v1.51.0/development.wasm"

WASM_EXEC_FILE="src/check-watch-panel/public/wasm_exec.js"
WASM_EXEC_URL="https://raw.githubusercontent.com/golang/go/c61e5e72447b568dd25367f592962c7ebf28b1c7/lib/wasm/wasm_exec.js"

# curl should work on mac, linux, and windows > 10
if [ ! -f "$WASM_FILE" ]; then
  curl -fL "$WASM_URL" -o "$WASM_FILE"
fi
if [ ! -f "$WASM_EXEC_FILE" ]; then
  curl -fL "$WASM_EXEC_URL" -o "$WASM_EXEC_FILE"
fi

cd src/check-watch-panel
yarn install
yarn build
