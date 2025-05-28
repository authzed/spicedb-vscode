import { useEffect, useState } from 'react';

import { VSCodeButton, VSCodePanelView, VSCodeProgressRing, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';
import yaml from 'yaml';

import './App.css';
import { useDeveloperService } from './services/developerservice';
import { LiveCheckItem, LiveCheckItemStatus, LiveCheckStatus, useLiveCheckService } from './services/livecheck';

function App() {
  useEffect(() => {
    const vscode = (window as any).acquireVsCodeApi();
    vscode.postMessage({ type: 'ready' });
  }, []);

  const [activeFilePath, setActiveFilePath] = useState<string | undefined>((window as any).ACTIVE_FILE_PATH);

  const [activeSchemaPath, setActiveSchemaPath] = useState<string | null>(null);
  const [activeSchema, setActiveSchema] = useState<string | null>(null);

  const [activeYamlPath, setActiveYamlPath] = useState<string | null>(null);
  const [activeYaml, setActiveYaml] = useState<string | null>(null);

  const [yamlIssue, setYamlIssue] = useState<string | null>(null);

  const devService = useDeveloperService();
  const liveCheckService = useLiveCheckService(devService);

  useEffect(() => {
    const listener = (event: any) => {
      const message = event.data;
      switch (message.type) {
        case 'addWatch':
          liveCheckService.addItem();
          break;

        case 'schema':
          setActiveSchemaPath(message.filename);
          setActiveSchema(message.schema);
          if (message.schema) {
            liveCheckService.updateSchema(message.schema);
          }
          break;

        case 'yaml':
          setActiveYamlPath(message.filename);
          setActiveYaml(message.yaml);

          if (message.yaml) {
            let parsed = null;
            try {
              parsed = yaml.parse(message.yaml, {
                prettyErrors: true,
                strict: true,
              });
            } catch (error: any) {
              setYamlIssue(error.toString());
              return;
            }

            if (!('relationships' in parsed)) {
              setYamlIssue('YAML file does not contain a "relationships" block');
              return;
            }

            const relationships = parsed.relationships;
            if (typeof relationships !== 'string') {
              setYamlIssue('YAML file "relationships" block must be a string, containing a relationship per newline');
              return;
            }

            setYamlIssue(null);
            liveCheckService.updateRelationships(relationships);
          }
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

  const updateWatch = (index: number, field: keyof LiveCheckItem, value: string) => {
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

  const isValidFile = !!activeFilePath && (activeFilePath.endsWith('.zed') || activeFilePath.endsWith('.zed.yaml'));
  const hasValidSchemaAndYaml = !!activeSchema && !!activeYaml && !yamlIssue;

  return (
    <VSCodePanelView>
      {!isValidFile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="codicon codicon-info"></i>
          <div>
            The current editor is not viewing a SpiceDB schema (<code>.zed</code>) file or relationships data file (<code>.zed.yaml</code>)
            file
          </div>
        </div>
      )}
      {isValidFile && !hasValidSchemaAndYaml && (
        <>
          {!activeSchema && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="codicon codicon-warning"></i>
              <div>
                No schema file with extension <code>.zed</code> found in the current directory.
              </div>
            </div>
          )}
          {!!activeSchema && !activeYaml && (
            <div style={{ display: 'block', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="codicon codicon-warning"></i>
                <div>
                  No valid relationships file with extension <code>.zed.yaml</code> found matching the schema file{' '}
                  <code>{activeSchemaPath}</code>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                <i className="codicon codicon-arrow-circle-right"></i>
                <div>
                  To enable the Check Watches panel, please create a YAML file named <code>{activeSchemaPath}.yaml</code>
                </div>
              </div>
            </div>
          )}
          {!!yamlIssue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="codicon codicon-warning"></i>
              <div style={{ color: '#FF8488' }}>
                Parse failure for YAML relationships file <code>{activeYamlPath}</code>: {yamlIssue}
              </div>
            </div>
          )}
        </>
      )}
      {isValidFile && hasValidSchemaAndYaml && devService.state.status !== 'ready' && <VSCodeProgressRing />}
      {isValidFile && hasValidSchemaAndYaml && devService.state.status === 'ready' && (
        <div style={{ width: '100%' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            {(liveCheckService.state.status === LiveCheckStatus.SERVICE_ERROR ||
              liveCheckService.state.status === LiveCheckStatus.PARSE_ERROR) && (
              <div
                style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  bottom: '0',
                  right: '0',
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'rgba(32, 32, 32, 0.9)',
                  zIndex: '100000000000',
                }}
              >
                {liveCheckService.state.status === LiveCheckStatus.SERVICE_ERROR && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="codicon codicon-error"></i>
                    <div style={{ color: 'red' }}>An error occurred while trying to run the checks</div>
                  </div>
                )}
                {liveCheckService.state.status === LiveCheckStatus.PARSE_ERROR && (
                  <div>
                    {liveCheckService.state.requestErrors?.map((err, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'orange', marginBottom: '5px' }}>
                        <i className="codicon codicon-warning"></i> {err.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div>
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
                        onChange={(field, value) => updateWatch(index, field, value)}
                      />
                    );
                  })}
                </table>
              )}
              {liveCheckService.items.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <VSCodeButton onClick={() => liveCheckService.addItem()}>Add SpiceDB Check Watch</VSCodeButton>
                </div>
              )}
            </div>
          </div>
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
    return <i className="codicon codicon-alert" style={{ color: 'yellow' }}></i>;
  }

  switch (props.item.status) {
    case LiveCheckItemStatus.NOT_CHECKED:
      return <i className="codicon codicon-circle-large-outline"></i>;

    case LiveCheckItemStatus.NOT_FOUND:
      return <i className="codicon codicon-stop" style={{ color: 'red' }}></i>;

    case LiveCheckItemStatus.FOUND:
      return <i className="codicon codicon-verified-filled" style={{ color: 'green' }}></i>;

    case LiveCheckItemStatus.INVALID:
      return <i className="codicon codicon-circle-slash" style={{ color: 'orange' }}></i>;

    case LiveCheckItemStatus.CAVEATED:
      return <i className="codicon codicon-array" style={{ color: 'purple' }}></i>;

    case LiveCheckItemStatus.NOT_VALID:
      return <i className="codicon codicon-circle-slash" style={{ color: 'orange' }}></i>;

    default:
      return <i className="codicon codicon-debug-step-over"></i>;
  }
}

export default App;
