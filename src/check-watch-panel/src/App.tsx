import './App.css';

import {
  VSCodeButton,
  VSCodePanelView,
  VSCodeProgressRing,
  VSCodeTextField,
} from '@vscode/webview-ui-toolkit/react';

import { useEffect, useState } from 'react';
import yaml from 'yaml';
import { useDeveloperService } from './services/developerservice';
import {
  LiveCheckItem,
  LiveCheckItemStatus,
  useLiveCheckService,
} from './services/livecheck';

function App() {
  useEffect(() => {
    const vscode = (window as any).acquireVsCodeApi();
    vscode.postMessage({ type: 'ready' });
  }, []);

  const [activeFilePath, setActiveFilePath] = useState<string | undefined>(
    (window as any).ACTIVE_FILE_PATH
  );

  const devService = useDeveloperService();
  const liveCheckService = useLiveCheckService(devService);

  useEffect(() => {
    const listener = (event: MessageEvent<any>) => {
      const message = event.data;
      switch (message.type) {
        case 'addWatch':
          liveCheckService.addItem();
          break;

        case 'schema':
          liveCheckService.updateSchema(message.schema);
          break;

        case 'yaml':
          const parsed = yaml.parse(message.yaml, {
            prettyErrors: true,
            strict: true,
          });
          liveCheckService.updateRelationships(parsed.relationships ?? '');
          break;

        case 'activeFile':
          setActiveFilePath(message.filePath);
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [liveCheckService]);

  const removeWatch = (index: number) => {
    liveCheckService.removeItem(liveCheckService.items[index]);
  };

  const updateWatch = (
    index: number,
    field: keyof LiveCheckItem,
    value: string
  ) => {
    const item = liveCheckService.items[index];
    switch (field) {
      case 'object':
        item.object = value;
        break;

      case 'action':
        item.action = value;
        break;

      case 'subject':
        item.subject = value;
        break;

      case 'context':
        item.context = value;
        break;
    }

    liveCheckService.itemUpdated(item);
  };

  const isValidFile =
    !!activeFilePath &&
    (activeFilePath.endsWith('.zed') || activeFilePath.endsWith('.zed.yaml'));

  return (
    <VSCodePanelView>
      {devService.state.status !== 'ready' && <VSCodeProgressRing />}
      {devService.state.status === 'ready' && !isValidFile && (
        <div>
          <div>
            The current editor is not viewing a SpiceDB schema or relationships
            file
          </div>
        </div>
      )}
      {devService.state.status === 'ready' && isValidFile && (
        <div style={{ width: '100%' }}>
          {liveCheckService.items.length > 0 && (
            <table style={{ width: '100%' }}>
              <thead className="table-header">
                <th></th>
                <th>Resource</th>
                <th>Permission</th>
                <th>Subject</th>
                <th>Caveat (Optional)</th>
                <th></th>
              </thead>
              {liveCheckService.items.map((item, index) => {
                return (
                  <WatchRow
                    item={item}
                    key={index}
                    onRemoveWatch={() => removeWatch(index)}
                    onChange={(field, value) =>
                      updateWatch(index, field, value)
                    }
                  />
                );
              })}
            </table>
          )}
          {liveCheckService.items.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <VSCodeButton onClick={() => liveCheckService.addItem()}>
                Add Watch
              </VSCodeButton>
            </div>
          )}
        </div>
      )}
    </VSCodePanelView>
  );
}

function WatchRow(props: {
  item: LiveCheckItem;
  onRemoveWatch: () => void;
  onChange: (field: keyof LiveCheckItem, value: string) => void;
}) {
  function updateWatch(field: keyof LiveCheckItem, target: EventTarget | null) {
    const value = (target as HTMLInputElement).value;
    props.onChange(field, value);
  }

  return (
    <>
      <tr>
        <td>
          <StatusIcon item={props.item} />
        </td>
        <td>
          <VSCodeTextField
            style={{ width: '100%' }}
            value={props.item.object}
            placeholder="document:1"
            onInput={(e) => updateWatch('object', e.target)}
          />
        </td>
        <td>
          <VSCodeTextField
            style={{ width: '100%' }}
            value={props.item.action}
            placeholder="view"
            onInput={(e) => updateWatch('action', e.target)}
          />
        </td>
        <td>
          <VSCodeTextField
            style={{ width: '100%' }}
            value={props.item.subject}
            placeholder="user:someuser"
            onInput={(e) => updateWatch('subject', e.target)}
          />
        </td>
        <td>
          <VSCodeTextField
            style={{ width: '100%' }}
            value={props.item.context}
            placeholder="{'some': 'context'}"
            onInput={(e) => updateWatch('context', e.target)}
          />
        </td>
        <td>
          <VSCodeButton onClick={() => props.onRemoveWatch()} appearance="icon">
            <i className="codicon codicon-chrome-close"></i>
          </VSCodeButton>
        </td>
      </tr>
      {!!props.item.errorMessage && (
        <tr>
          <td colSpan={5}>
            <div style={{ color: 'orange' }}>{props.item.errorMessage}</div>
          </td>
        </tr>
      )}
    </>
  );
}

function StatusIcon(props: { item: LiveCheckItem }) {
  // Icon reference: https://code.visualstudio.com/api/references/icons-in-labels
  if (props.item.errorMessage) {
    return (
      <i className="codicon codicon-alert" style={{ color: 'yellow' }}></i>
    );
  }

  switch (props.item.status) {
    case LiveCheckItemStatus.NOT_CHECKED:
      return <i className="codicon codicon-circle-large-outline"></i>;

    case LiveCheckItemStatus.NOT_FOUND:
      return <i className="codicon codicon-stop" style={{ color: 'red' }}></i>;

    case LiveCheckItemStatus.FOUND:
      return (
        <i
          className="codicon codicon-verified-filled"
          style={{ color: 'green' }}
        ></i>
      );

    case LiveCheckItemStatus.INVALID:
      return (
        <i
          className="codicon codicon-circle-slash"
          style={{ color: 'orange' }}
        ></i>
      );

    case LiveCheckItemStatus.CAVEATED:
      return (
        <i className="codicon codicon-array" style={{ color: 'purple' }}></i>
      );

    case LiveCheckItemStatus.NOT_VALID:
      return (
        <i
          className="codicon codicon-circle-slash"
          style={{ color: 'orange' }}
        ></i>
      );

    default:
      return <i className="codicon codicon-debug-step-over"></i>;
  }
}

export default App;
