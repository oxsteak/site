import { supabase } from "./supabase"

export interface Usuario {
  id: string
  auth_id?: string
  nome: string
  email: string
  loja_id: string
  loja_nome?: string
  loja_codigo?: string
  permissoes: string[]
  ativo: boolean
}

export const authService = {
  // Fazer login
  async login(email: string, password: string) {
    try {
      console.log("Tentando login para:", email)

      // 1. Tentar login direto
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error && data.user) {
        console.log("Login direto funcionou")
        const usuario = await this.obterUsuarioCompleto(data.user.id)
        return { user: usuario, session: data.session }
      }

      throw error || new Error("Falha no login")
    } catch (error) {
      console.error("Erro no login:", error)
      throw error
    }
  },

  // Obter usuário completo
  async obterUsuarioCompleto(authId: string): Promise<Usuario> {
    try {
      // Tentar por auth_id primeiro
      let { data, error } = await supabase
        .from("usuarios")
        .select(`
          *,
          lojas (
            id,
            nome,
            codigo
          )
        `)
        .eq("auth_id", authId)
        .single()

      // Se não encontrar, tentar por email
      if (error) {
        const { data: authUser } = await supabase.auth.getUser()
        if (authUser?.user?.email) {
          const result = await supabase
            .from("usuarios")
            .select(`
              *,
              lojas (
                id,
                nome,
                codigo
              )
            `)
            .eq("email", authUser.user.email)
            .single()

          data = result.data
          error = result.error

          // Atualizar auth_id se necessário
          if (!error && data && !data.auth_id) {
            await supabase.from("usuarios").update({ auth_id: authId }).eq("id", data.id)
            data.auth_id = authId
          }
        }
      }

      if (error || !data) {
        throw new Error("Usuário não encontrado na base de dados")
      }

      return {
        id: data.id,
        auth_id: data.auth_id || authId,
        nome: data.nome,
        email: data.email,
        loja_id: data.loja_id,
        loja_nome: data.lojas?.nome,
        loja_codigo: data.lojas?.codigo,
        permissoes: data.permissoes || [],
        ativo: data.ativo,
      }
    } catch (error) {
      console.error("Erro ao obter usuário completo:", error)
      throw error
    }
  },

  // Obter usuário atual
  async obterUsuarioAtual(): Promise<Usuario | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return null
      return await this.obterUsuarioCompleto(user.id)
    } catch (error) {
      console.error("Erro ao obter usuário atual:", error)
      return null
    }
  },

  // Fazer logout
  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Verificar sessão
  async verificarSessao() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  },

  // Escutar mudanças
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
