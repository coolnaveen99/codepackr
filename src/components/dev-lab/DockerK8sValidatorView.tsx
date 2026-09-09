import React, { useState, useEffect } from 'react';
import { Server, CheckCircle, AlertTriangle, Box, Layers, Container } from 'lucide-react';
import yaml from 'js-yaml';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface DockerK8sValidatorViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

const SAMPLE_K8S = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: codepackr-app
  namespace: production
  labels:
    app: codepackr
    environment: enterprise
spec:
  replicas: 3
  selector:
    matchLabels:
      app: codepackr
  template:
    metadata:
      labels:
        app: codepackr
    spec:
      containers:
      - name: web-gateway
        image: nginx:1.25-alpine
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: "500m"
            memory: "256Mi"
          requests:
            cpu: "100m"
            memory: "64Mi"
`;

const SAMPLE_DOCKER_COMPOSE = `version: '3.8'

services:
  app:
    image: node:20-alpine
    container_name: codepackr_node
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./data:/app/data
    depends_on:
      - redis

  redis:
    image: redis:7.0-alpine
    container_name: codepackr_cache
    restart: always
    ports:
      - "6379:6379"
`;

export const DockerK8sValidatorView: React.FC<DockerK8sValidatorViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [yamlInput, setYamlInput] = useState(initialInput.trim() || SAMPLE_K8S);
  const [result, setResult] = useState<{
    valid: boolean;
    data?: any;
    error?: string;
    type?: 'k8s' | 'docker-compose' | 'generic';
    containers?: string[];
    services?: string[];
  }>({ valid: true });

  const validateYaml = (val: string) => {
    try {
      const trimmed = val.trim();
      if (!trimmed) {
        setResult({ valid: false, error: 'YAML manifest is empty. Paste a Kubernetes or Docker YAML file.' });
        return;
      }

      const parsed = yaml.load(val);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('YAML document must contain a valid configuration object or manifest.');
      }

      let type: 'k8s' | 'docker-compose' | 'generic' = 'generic';
      const containers: string[] = [];
      const services: string[] = [];

      if ((parsed as any).kind && (parsed as any).apiVersion) {
        type = 'k8s';
        const podSpec = (parsed as any).spec?.template?.spec || (parsed as any).spec;
        if (podSpec?.containers && Array.isArray(podSpec.containers)) {
          podSpec.containers.forEach((c: any) => {
            if (c.name) containers.push(`${c.name} (${c.image || 'no image specified'})`);
          });
        }
      } else if ((parsed as any).services && typeof (parsed as any).services === 'object') {
        type = 'docker-compose';
        Object.keys((parsed as any).services).forEach((s) => {
          services.push(s);
        });
      }

      setResult({ valid: true, data: parsed, type, containers, services });
    } catch (e: any) {
      setResult({ valid: false, error: e.message || 'YAML parsing error' });
    }
  };

  useEffect(() => {
    validateYaml(yamlInput);
  }, []);

  const handleLoadK8s = () => {
    setYamlInput(SAMPLE_K8S);
    validateYaml(SAMPLE_K8S);
  };

  const handleLoadDocker = () => {
    setYamlInput(SAMPLE_DOCKER_COMPOSE);
    validateYaml(SAMPLE_DOCKER_COMPOSE);
  };

  const handleClear = () => {
    setYamlInput('');
    setResult({ valid: false, error: 'Manifest is empty.' });
  };

  return (
    <div id="docker-k8s-validator-view" className="space-y-6 animate-fade-in">
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleLoadK8s}
        resetLabel="Reset to Kubernetes Sample"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Pane */}
        <div
          className="p-5 rounded-2xl border space-y-3 shadow-xs"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Docker Compose / Kubernetes YAML Manifest
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadK8s}
                className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                Sample K8s
              </button>
              <span className="text-[var(--line)]">|</span>
              <button
                onClick={handleLoadDocker}
                className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                Sample Docker
              </button>
              <span className="text-[var(--line)]">|</span>
              <button
                onClick={handleClear}
                className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={yamlInput}
            onChange={(e) => {
              setYamlInput(e.target.value);
              validateYaml(e.target.value);
            }}
            rows={18}
            className="w-full p-3.5 rounded-xl border font-mono text-xs outline-none focus:border-[var(--brand)] transition-colors leading-relaxed"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            placeholder="apiVersion: apps/v1..."
          />
        </div>

        {/* Validation & Structural Inspection Pane */}
        <div
          className="p-5 rounded-2xl border space-y-4 shadow-xs"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--muted)]">
            Linting &amp; Structural Verification
          </h3>

          {result.valid ? (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center justify-between font-bold">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>Valid YAML Structure &amp; Syntax</span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/20 uppercase">
                  {result.type === 'k8s' ? 'Kubernetes Resource' : result.type === 'docker-compose' ? 'Docker Compose' : 'Generic YAML'}
                </span>
              </div>

              {result.type === 'k8s' && (
                <div
                  className="p-4 rounded-xl border space-y-2 font-mono"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                    <span className="text-[var(--muted)]">Kind / Type</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {result.data?.kind || 'Resource'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                    <span className="text-[var(--muted)]">API Version</span>
                    <span style={{ color: 'var(--ink)' }}>{result.data?.apiVersion || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                    <span className="text-[var(--muted)]">Resource Name</span>
                    <span className="font-bold" style={{ color: 'var(--ink)' }}>
                      {result.data?.metadata?.name || 'N/A'}
                    </span>
                  </div>
                  {result.data?.metadata?.namespace && (
                    <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                      <span className="text-[var(--muted)]">Namespace</span>
                      <span style={{ color: 'var(--ink)' }}>{result.data?.metadata?.namespace}</span>
                    </div>
                  )}
                  {typeof result.data?.spec?.replicas !== 'undefined' && (
                    <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                      <span className="text-[var(--muted)]">Desired Replicas</span>
                      <span className="font-bold text-[var(--brand)]">{result.data?.spec?.replicas}</span>
                    </div>
                  )}
                </div>
              )}

              {result.type === 'k8s' && result.containers && result.containers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                    <Container className="w-3.5 h-3.5 text-blue-500" />
                    <span>Declared Pod Containers ({result.containers.length})</span>
                  </h4>
                  <div className="space-y-1.5 font-mono text-xs">
                    {result.containers.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border flex items-center gap-2"
                        style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                      >
                        <Box className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate" style={{ color: 'var(--ink)' }}>
                          {c}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.type === 'docker-compose' && (
                <div
                  className="p-4 rounded-xl border space-y-2 font-mono"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                    <span className="text-[var(--muted)]">Compose File Version</span>
                    <span className="font-bold" style={{ color: 'var(--ink)' }}>
                      {result.data?.version || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                    <span className="text-[var(--muted)]">Services Count</span>
                    <span className="font-bold text-[var(--brand)]">{result.services?.length || 0}</span>
                  </div>
                </div>
              )}

              {result.type === 'docker-compose' && result.services && result.services.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Configured Services ({result.services.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                    {result.services.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border flex items-center gap-2"
                        style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                      >
                        <Box className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="font-bold truncate" style={{ color: 'var(--ink)' }}>
                          {s}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-mono flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Syntax Error:</span>
                <span className="break-all">{result.error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
