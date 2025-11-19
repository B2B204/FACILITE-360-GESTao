import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Send, X, ImageIcon } from 'lucide-react';
import { UploadFile } from '@/api/integrations';

export default function PostForm({ user, onPost }) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && attachments.length === 0) return;
    
    setIsPosting(true);
    try {
      await onPost({
        content: content.trim(),
        photo_urls: attachments,
        visibility: 'company'
      });
      setContent('');
      setAttachments([]);
    } catch (error) {
      console.error('Erro ao postar:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          // Validar tamanho do arquivo (max 10MB)
          if (file.size > 10 * 1024 * 1024) {
            alert(`A imagem "${file.name}" é muito grande. Tamanho máximo: 10MB`);
            continue;
          }
          
          const response = await UploadFile({ file });
          setAttachments(prev => [...prev, response.file_url]);
        } else {
          alert(`O arquivo "${file.name}" não é uma imagem válida.`);
        }
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="flex space-x-4">
            <Avatar className="ring-2 ring-blue-100">
              <AvatarImage src={user?.photo_url} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva um recado para a equipe..."
                className="min-h-[100px] resize-none border-gray-200 focus:border-blue-500 transition-colors"
              />
              
              {/* Preview das imagens anexadas */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {attachments.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="relative h-24 w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                        <img 
                          src={url} 
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploading}
                  />
                  <label 
                    htmlFor="file-upload" 
                    className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Anexar Fotos
                      </>
                    )}
                  </label>
                  {attachments.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {attachments.length} foto{attachments.length !== 1 ? 's' : ''} anexada{attachments.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                <Button 
                  type="submit"
                  disabled={(!content.trim() && attachments.length === 0) || isPosting}
                  className="bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  {isPosting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Postando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Postar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}