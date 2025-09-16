import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Building, Shield, Scale, ScrollText } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  documentType: string;
  keyPoints: string[];
  isActive: boolean;
}

interface TemplateSelectorProps {
  selectedTemplate: string;
  onTemplateChange: (templateId: string) => void;
  className?: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'contratos':
      return <FileText size={16} />;
    case 'trabalhista':
      return <Users size={16} />;
    case 'empresarial':
      return <Building size={16} />;
    case 'civil':
      return <Scale size={16} />;
    case 'criminal':
      return <Shield size={16} />;
    case 'constitucional':
      return <ScrollText size={16} />;
    default:
      return <FileText size={16} />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'contratos':
      return 'bg-blue-100 text-blue-800';
    case 'trabalhista':
      return 'bg-green-100 text-green-800';
    case 'empresarial':
      return 'bg-purple-100 text-purple-800';
    case 'civil':
      return 'bg-orange-100 text-orange-800';
    case 'criminal':
      return 'bg-red-100 text-red-800';
    case 'constitucional':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function TemplateSelector({ selectedTemplate, onTemplateChange, className = '' }: TemplateSelectorProps) {
  const [selectedTemplateData, setSelectedTemplateData] = useState<DocumentTemplate | null>(null);

  const { data: templates = [], isLoading } = useQuery<DocumentTemplate[]>({
    queryKey: ['/api/templates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/templates');
      return response.json();
    }
  });

  // Update selected template data when selection changes
  useEffect(() => {
    if (selectedTemplate && templates.length > 0) {
      const template = templates.find(t => t.id === selectedTemplate);
      setSelectedTemplateData(template || null);
    } else {
      setSelectedTemplateData(null);
    }
  }, [selectedTemplate, templates]);

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, DocumentTemplate[]>);

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>Tipo de Documento (Carregando...)</Label>
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="template-select" data-testid="label-template-selector">
          Tipo de Documento
        </Label>
        <Select value={selectedTemplate} onValueChange={onTemplateChange}>
          <SelectTrigger id="template-select" data-testid="select-template">
            <SelectValue placeholder="Selecione um tipo de documento para análise especializada" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="" data-testid="option-no-template">
              Análise Geral (sem template específico)
            </SelectItem>
            {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
              <div key={category}>
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-muted-foreground">
                  {getCategoryIcon(category)}
                  <span className="capitalize">{category}</span>
                </div>
                {categoryTemplates.map((template) => (
                  <SelectItem 
                    key={template.id} 
                    value={template.id}
                    data-testid={`option-template-${template.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{template.name}</span>
                      <Badge variant="secondary" className={getCategoryColor(template.category)}>
                        {template.documentType}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Template Details Card */}
      {selectedTemplateData && (
        <Card data-testid="card-template-details">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{selectedTemplateData.name}</CardTitle>
                <CardDescription className="mt-1">
                  {selectedTemplateData.description}
                </CardDescription>
              </div>
              <Badge className={getCategoryColor(selectedTemplateData.category)}>
                {selectedTemplateData.category}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div>
              <h4 className="text-sm font-medium mb-2">Pontos de Análise Específicos:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {selectedTemplateData.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}