// Type declarations for SCSS modules
declare module "*.scss" {
  const content: Record<string, string>
  export default content
}

// Allow importing SCSS files without type errors
declare module "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
declare module "@/components/tiptap-node/code-block-node/code-block-node.scss"
declare module "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
declare module "@/components/tiptap-node/list-node/list-node.scss"
declare module "@/components/tiptap-node/image-node/image-node.scss"
declare module "@/components/tiptap-node/heading-node/heading-node.scss"
declare module "@/components/tiptap-node/paragraph-node/paragraph-node.scss"
declare module "@/components/tiptap-templates/simple/simple-editor.scss"
