import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { cn } from '@nicenote/ui'

export const CodeBlockComponent = ({
  node: {
    attrs: { language: defaultLanguage },
  },
  updateAttributes,
  extension,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) => {
  return (
    <NodeViewWrapper className={cn('relative', 'code-block')}>
      <select
        contentEditable={false}
        defaultValue={defaultLanguage}
        onChange={(event) => updateAttributes({ language: event.target.value })}
        className="absolute bg-background px-2.5 py-1.5 font-sans text-sm font-medium leading-tight rounded-md right-2 top-2 border border-border shadow-sm"
      >
        <option value="null">auto</option>
        <option disabled>—</option>
        {extension.options.lowlight.listLanguages().map((lang: string, index: number) => (
          <option key={index} value={lang}>
            {lang}
          </option>
        ))}
      </select>

      <pre className="bg-black rounded-md text-white font-mono my-6 p-4">
        {/* Tiptap's NodeViewContent type only accepts 'div', but we need 'code' for semantic HTML */}
        {/* @ts-expect-error - Tiptap type limitation */}
        <NodeViewContent as="code" className="bg-transparent text-inherit text-[0.8rem] p-0" />
      </pre>
    </NodeViewWrapper>
  )
}
