import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Trash2, MoreVertical, ZoomIn } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import DeleteConfirmation from '@/components/common/DeleteConfirmation';

export default function PostCard({ post, author, currentUser, onLike, onDelete }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const hasLiked = post.likes?.includes(currentUser?.email);
  const canDelete = post.created_by === currentUser?.email || currentUser?.department === 'admin';

  const handleDeleteConfirm = async () => {
    await onDelete(post.id);
    setIsDeleteDialogOpen(false);
  };

  const handleLike = () => {
    onLike(post);
  };

  const renderImages = () => {
    if (!post.photo_urls || post.photo_urls.length === 0) return null;

    const imageCount = post.photo_urls.length;

    // Função para determinar o layout baseado na quantidade de imagens
    const getImageLayout = (count) => {
      switch (count) {
        case 1:
          return "grid-cols-1";
        case 2:
          return "grid-cols-2";
        case 3:
          return "grid-cols-3";
        case 4:
          return "grid-cols-2";
        default:
          return "grid-cols-3";
      }
    };

    // Função para determinar a altura baseada na quantidade
    const getImageHeight = (count, index) => {
      if (count === 1) return "h-64 md:h-80"; // Imagem única maior
      if (count === 2) return "h-48 md:h-56"; // Duas imagens médias
      if (count === 3) return "h-40 md:h-48"; // Três imagens menores
      if (count === 4) {
        return index < 2 ? "h-40 md:h-48" : "h-40 md:h-48"; // Grid 2x2
      }
      return "h-32 md:h-40"; // Muitas imagens, tamanho menor
    };

    return (
      <div className={`grid gap-2 mb-4 ${getImageLayout(imageCount)}`}>
        {post.photo_urls.slice(0, 6).map((url, index) => (
          <div key={index} className="relative group">
            <Dialog>
              <DialogTrigger asChild>
                <div
                  className={`relative ${getImageHeight(imageCount, index)} rounded-lg overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02] shadow-sm hover:shadow-md`}
                >
                  <img
                    src={url}
                    alt={`Anexo ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Overlay com ícone de zoom */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  
                  {/* Indicador de mais imagens */}
                  {index === 5 && post.photo_urls.length > 6 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">
                        +{post.photo_urls.length - 6}
                      </span>
                    </div>
                  )}
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                <div className="relative">
                  <img
                    src={url}
                    alt={`Anexo ${index + 1} - Visualização completa`}
                    className="w-full h-auto max-h-[85vh] object-contain"
                  />
                  {/* Navegação entre imagens (se houver múltiplas) */}
                  {post.photo_urls.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                      {index + 1} de {post.photo_urls.length}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center space-x-4 pb-3">
          <Avatar className="ring-2 ring-blue-100">
            <AvatarImage src={author?.photo_url} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              {author?.full_name?.charAt(0) || author?.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">
              {author?.full_name || author?.email || 'Usuário'}
            </p>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.created_date), { 
                addSuffix: true, 
                locale: pt 
              })}
            </p>
          </div>
          {canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-gray-900 mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>
          
          {/* Renderizar imagens com novo layout */}
          {renderImages()}
          
          <div className="flex items-center space-x-4 pt-3 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`${hasLiked ? 'text-blue-600 bg-blue-50' : 'text-gray-500'} hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200`}
            >
              <ThumbsUp className={`w-4 h-4 mr-2 ${hasLiked ? 'fill-current' : ''}`} />
              {post.likes?.length || 0} Curtidas
            </Button>
          </div>
          {post.updated_at && post.updated_at !== post.created_at && (
            <div className="text-xs text-gray-400 mt-2 text-right">
              Editado em: {format(new Date(post.updated_at), "dd/MM/yyyy 'às' HH:mm")}
            </div>
          )}
        </CardContent>
      </Card>
      
      <DeleteConfirmation
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Deseja realmente excluir este post?"
        description="Esta ação marcará o post como excluído. Um administrador poderá restaurá-lo da lixeira."
        itemName="Post"
        isPermanent={false}
      />
    </>
  );
}