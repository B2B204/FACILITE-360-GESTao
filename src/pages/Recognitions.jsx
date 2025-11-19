import React, { useState, useEffect } from 'react';
import { Employee } from '@/api/entities';
import { User } from '@/api/entities';
import { Post } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Gift, MessageSquare, RefreshCw, AlertCircle, Mail } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import PostForm from '@/components/recados/PostForm';
import PostCard from '@/components/recados/PostCard';
import { SendEmail } from '@/api/integrations';

export default function RecognitionsPage() {
  const [user, setUser] = useState(null);
  const [companyAnniversaries, setCompanyAnniversaries] = useState([]);
  const [posts, setPosts] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [isLoading, setIsLoading] = useState({ posts: false, anniversaries: false });
  const [error, setError] = useState({ posts: null, anniversaries: null });

  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      if (currentUser?.cnpj) {
        await loadPostsAndUsers(currentUser);
        await loadAnniversaries(currentUser);
      }
    } catch (e) {
      console.error("Erro ao carregar usuário:", e);
      setError(prev => ({ ...prev, posts: "Erro ao carregar dados do usuário." }));
    }
  };

  const loadPostsAndUsers = async (currentUser = user) => {
    if (!currentUser?.cnpj) return;
    
    setIsLoading(prev => ({ ...prev, posts: true }));
    setError(prev => ({ ...prev, posts: null }));
    
    try {
      // CORREÇÃO: Filtrar posts excluídos de forma mais robusta
      let postsData = [];
      try {
        const allPosts = await Post.list("-created_date", 100);
        // Filtrar apenas posts da empresa E que NÃO foram excluídos
        postsData = allPosts.filter(post => 
          post.cnpj === currentUser.cnpj && 
          !post.deleted_at // Excluir posts que têm deleted_at definido
        );
        console.log(`📋 Posts filtrados: ${postsData.length} (empresa: ${currentUser.cnpj})`);
      } catch (postError) {
        console.warn("Erro ao carregar posts:", postError);
        postsData = [];
      }
      
      // Carregar usuários
      let usersData = [];
      try {
        usersData = await User.filter({ cnpj: currentUser.cnpj });
      } catch (userError) {
        console.warn("Erro ao carregar usuários:", userError);
        usersData = [currentUser]; // Pelo menos o usuário atual
      }
      
      const uMap = usersData.reduce((acc, u) => {
        acc[u.email] = u;
        return acc;
      }, {});
      
      setUsersMap(uMap);
      setPosts(postsData);
      
      console.log(`📋 Carregados ${postsData.length} posts ativos para empresa ${currentUser.cnpj}`);

    } catch (err) {
      console.error("Erro geral ao carregar posts:", err);
      setError(prev => ({ 
        ...prev, 
        posts: "Não foi possível carregar o mural. Verifique sua conexão e tente novamente." 
      }));
      // Mesmo com erro, não deixar vazio - carregar pelo menos a interface
      setPosts([]);
      setUsersMap({ [currentUser.email]: currentUser });
    } finally {
      setIsLoading(prev => ({ ...prev, posts: false }));
    }
  };

  const loadAnniversaries = async (currentUser = user) => {
    if (!currentUser?.cnpj) return;
    
    setIsLoading(prev => ({ ...prev, anniversaries: true }));
    setError(prev => ({ ...prev, anniversaries: null }));
    
    try {
      const employeesData = await Employee.filter({ 
        cnpj: currentUser.cnpj, 
        status: 'ativo' 
      });
      
      const today = new Date();
      const currentMonth = today.getMonth();
      
      const anniversaries = employeesData.filter(emp => {
        if (!emp.admission_date) return false;
        const admissionDate = new Date(emp.admission_date);
        return admissionDate.getMonth() === currentMonth && differenceInYears(today, admissionDate) >= 1;
      }).map(emp => ({
        ...emp,
        yearsWorking: differenceInYears(today, new Date(emp.admission_date))
      }));
      
      setCompanyAnniversaries(anniversaries);
      
    } catch(err) {
      console.error("Erro ao carregar aniversários:", err);
      setError(prev => ({ ...prev, anniversaries: "Não foi possível carregar os aniversários." }));
      setCompanyAnniversaries([]);
    } finally {
      setIsLoading(prev => ({ ...prev, anniversaries: false }));
    }
  };
  
  const handleSendRecognition = async () => {
    if (!companyAnniversaries || companyAnniversaries.length === 0) {
      alert("Nenhum aniversariante para notificar este mês.");
      return;
    }

    if (!window.confirm(`Você está prestes a notificar ${companyAnniversaries.length} aniversariante(s) por e-mail. Deseja continuar?`)) {
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const emp of companyAnniversaries) {
      if (emp.email) {
        try {
          const subject = `🎉 Reconhecimento de Aniversário de Empresa!`;
          const body = `
            <p>Olá, ${emp.name}!</p>
            <p>A <strong>${user.company_name || 'nossa empresa'}</strong> te parabeniza por completar <strong>${emp.yearsWorking} ano(s)</strong> de dedicação e trabalho conosco!</p>
            <p>Agradecemos por sua contribuição e esperamos celebrar muitos outros aniversários juntos.</p>
            <br>
            <p>Atenciosamente,</p>
            <p><strong>Equipe FaciliGestor360</strong></p>
          `;
          await SendEmail({ to: emp.email, subject, body });
          successCount++;
        } catch (error) {
          console.error(`Falha ao enviar e-mail para ${emp.email}:`, error);
          errorCount++;
        }
      } else {
        errorCount++;
      }
    }

    alert(`${successCount} e-mail(s) de reconhecimento enviado(s) com sucesso. Falhas: ${errorCount}.`);
  };

  const handlePost = async (postData) => {
    try {
      await Post.create({
        ...postData,
        cnpj: user.cnpj,
        created_by: user.email,
        likes: []
      });
      // Recarregar posts
      await loadPostsAndUsers();
    } catch (error) {
      console.error("Erro ao criar post:", error);
      alert("Erro ao publicar o recado. Tente novamente.");
    }
  };

  const handleLike = async (post) => {
    try {
      const currentLikes = post.likes || [];
      const userEmail = user.email;
      const hasLiked = currentLikes.includes(userEmail);
      const newLikes = hasLiked 
        ? currentLikes.filter(email => email !== userEmail)
        : [...currentLikes, userEmail];
      
      await Post.update(post.id, { likes: newLikes });
      await loadPostsAndUsers();
    } catch (error) {
      console.error("Erro ao curtir post:", error);
    }
  };

  const handleDelete = async (postId) => {
    try {
      // CORREÇÃO: Marcar como excluído com soft delete
      await Post.update(postId, {
        deleted_at: new Date().toISOString(),
        deleted_by: user.email,
      });
      
      // CORREÇÃO: Remover o post imediatamente da lista local para evitar cache
      setPosts(prevPosts => {
        const filteredPosts = prevPosts.filter(post => post.id !== postId);
        console.log(`🗑️ Post ${postId} removido da visualização. Posts restantes: ${filteredPosts.length}`);
        return filteredPosts;
      });
      
      console.log(`✅ Post ${postId} marcado como excluído e removido da visualização`);
      
    } catch (error) {
      console.error("Erro ao excluir post:", error);
      alert("Erro ao excluir o recado. Tente novamente.");
    }
  };

  const handleTryAgain = () => {
    loadPostsAndUsers();
  };

  if (!user) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <PostForm user={user} onPost={handlePost} />
          
          {/* Posts ou Estado de Erro */}
          {error.posts ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao Carregar Mural</h3>
                <p className="text-red-700 mb-4">{error.posts}</p>
                <Button 
                  onClick={handleTryAgain}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          ) : isLoading.posts ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando mural...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {posts.map(post => {
                const author = usersMap[post.created_by] || { 
                  full_name: post.created_by, 
                  photo_url: null 
                };
                return (
                  <PostCard 
                    key={post.id}
                    post={post}
                    author={author} 
                    currentUser={user}
                    onLike={handleLike}
                    onDelete={handleDelete}
                  />
                );
              })}
              {posts.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum recado ainda</h3>
                    <p className="text-gray-600">Seja o primeiro a compartilhar algo com a equipe!</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
        
        {/* Sidebar com Aniversários */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="w-6 h-6 mr-3 text-purple-600" />
                Aniversários de Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading.anniversaries ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Carregando...</p>
                </div>
              ) : error.anniversaries ? (
                <div className="text-center py-8 text-red-600">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">{error.anniversaries}</p>
                </div>
              ) : companyAnniversaries.length > 0 ? (
                <div className="space-y-4">
                  {companyAnniversaries.map((emp) => (
                    <div key={emp.id} className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <Avatar>
                        <AvatarImage src={emp.photo_url} />
                        <AvatarFallback className="bg-purple-100 text-purple-700">
                          {emp.name?.charAt(0) || 'F'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{emp.name}</p>
                        <p className="text-sm text-gray-600">{emp.role}</p>
                        <p className="text-xs text-purple-600">
                          {emp.yearsWorking} ano{emp.yearsWorking !== 1 ? 's' : ''} na empresa
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Gift className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum aniversário de empresa este mês.</p>
                </div>
              )}
              {companyAnniversaries.length > 0 && (
                 <Button onClick={handleSendRecognition} className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Reconhecimento
                 </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}