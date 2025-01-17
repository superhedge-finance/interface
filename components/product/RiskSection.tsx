import Link from 'next/link';

interface RiskSectionProps {
  riskText: string;
}

export const RiskSection = ({ riskText }: RiskSectionProps) => {
  const formatRiskText = (text: string) => {
    const sections = text.split(/(?=[A-Z][a-z]+:?\n|[A-Z][a-z]+\n)/);
    
    return sections.map((section, index) => {
      // Extract title and content
      const lines = section.trim().split('\n');
      const title = lines[0];
      const content = lines.slice(1).join(' ')
        .trim()
        .replace(/\(hyperlink "here",\s*[^)]*\)/g, '');

      // Process content to add hyperlinks
      const processedContent = content.replace(
        /DYOR here\.|audited by Halborn/g,
        (match) => {
          const url = match === 'DYOR here.' 
            ? (content.includes('Ethena') ? 'https://docs.ethena.fi/' : 'https://docs.pendle.finance/')
            : 'https://www.halborn.com/audits/superhedge-finance/superhedge-v1-core';
          
          return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700">${match}</a>`;
        }
      );

      return (
        <div key={index} className="mb-6">
          <h4 className="font-semibold text-lg mb-2">{title}</h4>
          <p 
            className="text-gray-700"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      {formatRiskText(riskText)}
    </div>
  );
}; 