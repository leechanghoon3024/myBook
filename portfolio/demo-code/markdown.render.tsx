import React, { useState, useRef, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { CopyIcon, CheckCopyIcon } from '@assets/icons';
import { MarkdownCopyButton, CodeBlockWrapper, CodeBlockHeader } from '@/components/chat/markdown.style';
import { Paragraph } from '@/components/typography/text.typography';
interface ICodeProps {
    inline?: boolean;
    className?: string;
    children: ReactNode;
}

/** 코드 블록 컴포넌트 */
const CodeBlock = ({ inline, className, children, ...props }: ICodeProps) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeContent = String(children).trim();
    const language = match ? match[1] : 'code';
    const copiedRef = useRef(false);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        if (!navigator?.clipboard) return;
        try {
            await navigator.clipboard.writeText(codeContent);
            copiedRef.current = true;
            setCopied(true);
            setTimeout(() => {
                copiedRef.current = false;
                setCopied(false);
            }, 3000);
        } catch (error) {
            console.error('Clipboard copy failed:', error);
        }
    };

    if (inline || !match) {
        return <code className={className} {...props}>{children}</code>;
    }

    return (
        <CodeBlockWrapper>
            <CodeBlockHeader>
                <span>{language}</span>
                <MarkdownCopyButton onClick={copyToClipboard}>
                    {copied ? (
                        <>
                            <CheckCopyIcon />
                            <Paragraph>Copied!</Paragraph>
                        </>
                    ) : (
                        <>
                            <CopyIcon />
                            <Paragraph>Copy</Paragraph>
                        </>
                    )}
                </MarkdownCopyButton>
            </CodeBlockHeader>
            <SyntaxHighlighter language={language} style={tomorrow} customStyle={{ margin: 0, padding: '16px', fontSize: '12px' }}>
                {codeContent}
            </SyntaxHighlighter>
        </CodeBlockWrapper>
    );
};


export const MarkdownRender = ({ content } : { content: string }) => {
    return (
        <ReactMarkdown
            components={{
                code: CodeBlock
            }}
        >
            {content}
        </ReactMarkdown>
    );
};