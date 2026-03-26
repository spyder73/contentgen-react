import React, { useEffect, useRef, useState } from 'react';

interface Section {
  id: string;
  label: string;
  children?: { id: string; label: string }[];
}

const SECTIONS: Section[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'studio', label: 'Studio' },
  { id: 'series', label: 'Series' },
  {
    id: 'pipelines',
    label: 'Pipelines',
    children: [
      { id: 'using-a-pipeline', label: 'Using a Pipeline' },
      { id: 'what-is-json', label: 'What is JSON?' },
      { id: 'pipeline-editor', label: 'The Pipeline Editor' },
      { id: 'output-format', label: 'Output Format' },
      { id: 'checkpoint-prompt', label: 'Checkpoint: Prompt' },
      { id: 'checkpoint-distributor', label: 'Checkpoint: Distributor' },
      { id: 'checkpoint-connector', label: 'Checkpoint: Connector' },
      { id: 'checkpoint-generator', label: 'Checkpoint: Generator' },
      { id: 'checkpoint-upload', label: 'Checkpoint: Upload' },
      { id: 'input-mapping', label: 'Input Mapping' },
      { id: 'flags', label: 'Flags' },
      { id: 'required-assets', label: 'Required Assets' },
      { id: 'variable-flow-viewer', label: 'Variable Flow Viewer' },
    ],
  },
];

function DocSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10">
      <h2 className="section-title mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--app-text)' }}>
        {children}
      </div>
    </section>
  );
}

function SubSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="mb-6 scroll-mt-4">
      <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--app-text-muted)' }}>
        {title}
      </h3>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      className="px-1.5 py-0.5 rounded text-xs font-mono"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}
    >
      {children}
    </code>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      className="p-4 rounded text-xs font-mono overflow-x-auto"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--app-text)',
      }}
    >
      {children}
    </pre>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-strong)' }}>
            {headers.map((h) => (
              <th key={h} className="text-left py-2 pr-6 font-semibold uppercase tracking-widest" style={{ color: 'var(--app-text-muted)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-6 align-top">
                  {j === 0 ? <InlineCode>{cell}</InlineCode> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DocsView: React.FC = () => {
  const [activeId, setActiveId] = useState<string>('overview');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const allIds = SECTIONS.flatMap((s) => [s.id, ...(s.children?.map((c) => c.id) ?? [])]);
    const observers: IntersectionObserver[] = [];

    allIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id);
        },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex gap-8 h-full min-h-0">
      {/* Sidebar */}
      <aside
        className="hidden lg:block w-56 flex-shrink-0"
        style={{ position: 'sticky', top: 0, height: 'fit-content', paddingTop: '1.5rem' }}
      >
        <nav className="space-y-0.5">
          {SECTIONS.map((section) => (
            <div key={section.id}>
              <button
                onClick={() => scrollTo(section.id)}
                className="w-full text-left px-3 py-1.5 text-xs uppercase tracking-widest rounded transition-colors"
                style={{
                  color: activeId === section.id ? 'var(--app-text)' : 'var(--app-text-muted)',
                  background: activeId === section.id ? 'var(--surface-2)' : 'transparent',
                  fontWeight: activeId === section.id ? '600' : '400',
                }}
              >
                {section.label}
              </button>
              {section.children?.map((child) => (
                <button
                  key={child.id}
                  onClick={() => scrollTo(child.id)}
                  className="w-full text-left pl-6 pr-3 py-1 text-xs rounded transition-colors"
                  style={{
                    color: activeId === child.id ? 'var(--app-text)' : 'var(--app-text-muted)',
                    background: activeId === child.id ? 'var(--surface-2)' : 'transparent',
                    opacity: activeId === child.id ? 1 : 0.75,
                  }}
                >
                  {child.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div ref={contentRef} className="flex-1 min-w-0 overflow-y-auto py-6 pr-2">

        <DocSection id="overview" title="Overview">
          <p>
            SpyderGen turns an idea into a video. You type a prompt, pick a pipeline, and the system calls a
            chain of AI providers — text models, image generators, video renderers — to produce finished clips.
          </p>
          <p>
            There are three main areas: <strong>Studio</strong> (run pipelines, browse clips),{' '}
            <strong>Series</strong> (manage characters and episodes), and{' '}
            <strong>Pipelines</strong> (edit the logic that drives generation).
          </p>
        </DocSection>

        <DocSection id="studio" title="Studio">
          <p>Studio is the main workspace. It has two panels side by side.</p>

          <SubSection id="studio" title="Ideas Panel">
            <p>
              The left panel is your idea queue. Type or paste a prompt, then click <strong>Add</strong> to save
              it. Each idea is the starting point for one pipeline run. You can have many ideas queued up.
            </p>
          </SubSection>

          <SubSection id="studio" title="Clips Panel">
            <p>
              The right panel shows the clips that have been generated. Each card shows a thumbnail, the prompt
              it was made from, and action buttons to play, download, or regenerate it.
            </p>
          </SubSection>

          <SubSection id="studio" title="Generate Button">
            <p>
              Select an idea, then click <strong>Generate</strong>. This starts a pipeline run for that idea.
              Progress appears in the clips panel as checkpoints complete.
            </p>
          </SubSection>

          <SubSection id="studio" title="Pause / Continue">
            <p>
              Some pipelines pause at a confirmation point — for example, after generating a character reference
              image but before rendering all the scene images. You will see a <strong>Continue</strong> button.
              Review what was produced, then click Continue to let the pipeline proceed.
            </p>
          </SubSection>
        </DocSection>

        <DocSection id="series" title="Series">
          <p>
            A Series is a collection of episodes that share the same characters. Think of it as a show: one set
            of characters, many episodes.
          </p>
          <p>
            Each character has a <strong>reference image</strong> — a photo or illustration the image AI uses to
            keep the character consistent across episodes. Upload a reference image when you create a character.
          </p>
          <p>
            To generate an episode, select your Series, pick or write an episode brief, and click Generate. The
            pipeline will use the character references automatically.
          </p>
        </DocSection>

        <DocSection id="pipelines" title="Pipelines">
          <p>
            A pipeline is the recipe for how your idea becomes a video. It is a sequence of steps —
            checkpoints — each doing one job: writing a prompt, generating an image, rendering a video clip,
            and so on.
          </p>

          <SubSection id="using-a-pipeline" title="Using a Pipeline">
            <p>
              Click <strong>Pipelines</strong> in the header to open the Pipeline Manager. Here you can see all
              available pipelines, create new ones, or edit existing ones. To use a pipeline in Studio, select
              it from the dropdown before clicking Generate.
            </p>
          </SubSection>

          <SubSection id="what-is-json" title="What is JSON?">
            <p>
              JSON is the language pipelines use to talk to AI models. Instead of freeform chat, JSON is a
              structured format with labelled fields — like a form. When a Prompt checkpoint runs, it tells the
              AI which fields to fill in and in what shape. This makes the output predictable and
              machine-readable so the next checkpoint can use it.
            </p>
            <CodeBlock>{`{
  "scene_title": "A rainy night in Tokyo",
  "mood": "melancholic",
  "duration_seconds": 5
}`}
            </CodeBlock>
            <p>
              The keys (like <InlineCode>scene_title</InlineCode>) are the field names. The values are what the
              AI writes in. Downstream checkpoints reference these fields by name in their input mapping.
            </p>
          </SubSection>

          <SubSection id="pipeline-editor" title="The Pipeline Editor">
            <p>
              Click a pipeline to open the editor. The left side shows a <strong>visual flow</strong> — each
              checkpoint as a node, connected in order from IN to OUT. Click a node to select it and see its
              settings in the right panel.
            </p>
            <p>
              At the top right: a <strong>Save</strong> button and a <strong>{"[]"}</strong> button that opens
              the Variable Flow Viewer.
            </p>
          </SubSection>

          <SubSection id="output-format" title="Output Format">
            <p>
              Output Format is a set of global defaults applied to all media generated in this pipeline:
            </p>
            <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--app-text)' }}>
              <li>Image provider and model</li>
              <li>Video provider and model</li>
              <li>Dimensions (width × height in pixels)</li>
              <li>Duration (seconds per clip)</li>
            </ul>
            <p>Individual Generator checkpoints can override these defaults.</p>
          </SubSection>

          <SubSection id="checkpoint-prompt" title="Checkpoint: Prompt">
            <p>
              Sends text to an AI language model and gets structured JSON back. Use this to turn a raw idea
              into specific scene descriptions, character details, or any other structured data a later
              checkpoint needs.
            </p>
            <p>
              Configure: <InlineCode>promptGate</InlineCode> (which AI model), the prompt template (with{' '}
              <InlineCode>{'{{variables}}'}</InlineCode> for dynamic input), and input mapping.
            </p>
          </SubSection>

          <SubSection id="checkpoint-distributor" title="Checkpoint: Distributor">
            <p>
              Fan-out: takes one input and asks the AI to produce <em>N</em> variations (e.g., 6 scene
              descriptions). Each variation spawns a <strong>child pipeline run</strong> that processes that
              scene independently.
            </p>
            <p>
              Configure: <InlineCode>max_children</InlineCode> (how many variations), delimiter (newline or
              JSON array), and the AI model.
            </p>
          </SubSection>

          <SubSection id="checkpoint-connector" title="Checkpoint: Connector">
            <p>
              Fan-in: waits for all child runs spawned by a Distributor to finish, then collects their outputs
              into one list so the next checkpoint can use them all at once.
            </p>
            <p>
              You must point the Connector at the matching Distributor's ID. A Distributor without a Connector
              will leave children running with no way to merge their results.
            </p>
          </SubSection>

          <SubSection id="checkpoint-generator" title="Checkpoint: Generator">
            <p>
              Calls an image or video AI provider to produce media. The output is a file stored in the media
              library.
            </p>
            <p>
              Configure: provider (e.g., Runware), model, mode (<InlineCode>text-to-image</InlineCode> or{' '}
              <InlineCode>image-to-image</InlineCode>), and output dimensions. For image-to-image, set a seed
              image via <InlineCode>required_assets</InlineCode>.
            </p>
          </SubSection>

          <SubSection id="checkpoint-upload" title="Checkpoint: Upload">
            <p>
              Pauses the pipeline and asks the user to attach a file — for example, a character reference
              photo. The file is stored and available to any downstream checkpoint that lists it in{' '}
              <InlineCode>required_assets</InlineCode>.
            </p>
            <p>
              The pipeline will not continue past an Upload checkpoint until the user has provided the file.
            </p>
          </SubSection>

          <SubSection id="input-mapping" title="Input Mapping">
            <p>
              Input mapping is how each checkpoint knows where to get its data. Every variable in a checkpoint
              points to a source using a simple syntax:
            </p>
            <Table
              headers={['Source syntax', 'Meaning']}
              rows={[
                ['initial_input', "The user's original idea text"],
                ['checkpoint:some-id', 'Full output of that checkpoint'],
                ['checkpoint:some-id.field', 'A specific JSON field from a checkpoint output'],
                ['literal:value', 'A hardcoded constant — e.g. literal:6'],
                ['pipeline_output_contract', 'Metadata about the final output format'],
              ]}
            />
            <p className="mt-3">
              Example: a Generator checkpoint sets its <InlineCode>prompt</InlineCode> input to{' '}
              <InlineCode>checkpoint:scene-prompt</InlineCode>. That means it takes exactly the text the
              previous Prompt checkpoint produced and uses it as the image generation prompt.
            </p>
          </SubSection>

          <SubSection id="flags" title="Flags">
            <p>Three toggles available on most checkpoints:</p>
            <Table
              headers={['Flag', 'Effect']}
              rows={[
                ['requires_confirm', 'Pipeline pauses here; user must click Continue to proceed'],
                ['allow_regenerate', 'User can re-run this checkpoint with tweaked inputs'],
                ['chain_last_frames', 'Injects the last frame of the preceding video for visual continuity'],
              ]}
            />
          </SubSection>

          <SubSection id="required-assets" title="Required Assets">
            <p>
              Some checkpoints need a media file to work — for example, an image-to-image Generator needs a
              seed image to start from. These are declared in the checkpoint's{' '}
              <InlineCode>required_assets</InlineCode> list.
            </p>
            <p>
              An Upload checkpoint earlier in the pipeline is the usual way to provide these files. When the
              generator runs, it looks up the asset by the name you declared and uses it automatically.
            </p>
          </SubSection>

          <SubSection id="variable-flow-viewer" title="Variable Flow Viewer">
            <p>
              Click the <strong>{"[]"}</strong> button next to Save in the Pipeline Editor to open the Variable
              Flow Viewer full-screen.
            </p>
            <p>It shows two rows of nodes:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Checkpoint Rail</strong> — all checkpoints laid out in order, draggable for reordering
              </li>
              <li>
                <strong>Artifact Buses</strong> — data lanes (Source, Prompts, Media, Payloads) showing what
                each checkpoint reads and produces, with connecting lines
              </li>
            </ul>
            <p>
              Use this to understand data flow before editing a complex pipeline. It makes it easy to see if a
              checkpoint's input is wired to the right source and spot any gaps.
            </p>
          </SubSection>
        </DocSection>
      </div>
    </div>
  );
};

export default DocsView;
