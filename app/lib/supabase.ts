import { createClient } from "@supabase/supabase-js"

// Configuração do Supabase
const supabaseUrl = "https://iuamdrftgebbvwpkawqh.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YW1kcmZ0Z2ViYnZ3cGthd3FoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDYzMDQ5MywiZXhwIjoyMDY2MjA2NDkzfQ.pNAJmU-_o7mgH5Wh_vPhY2eDvn6JY1OFDwQNJRzxrRw"

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos para o banco de dados
export interface Loja {
  id: string
  nome: string
  codigo: string
  endereco?: string
  telefone?: string
  ativo: boolean
}

export interface Inventario {
  id: string
  setor: string
  data_criacao: string
  status: "em_contagem" | "finalizado" | "conciliado"
  usuario_id: string
  usuario_nome?: string
  loja_id: string
  total_itens?: number
}

export interface ItemInventario {
  id: string
  inventario_id: string
  produto_id: string
  produto_nome: string
  produto_unidade: string
  produto_categoria?: string
  produto_cod_item?: string
  quantidade_fechada: number
  quantidade_em_uso: number
  data_contagem: string
}

export interface Produto {
  id: string
  nome: string
  categoria: string
  unidade: string
  cod_item?: string
  loja_id: string
  ativo: boolean
}

// Serviço de inventário
export const inventarioService = {
  // Listar inventários apenas da loja do usuário
  async listar(lojaId: string) {
    const { data, error } = await supabase
      .from("inventarios")
      .select("*, itens_inventario(*)")
      .eq("loja_id", lojaId)
      .order("data_criacao", { ascending: false })

    if (error) throw error
    return data as (Inventario & { itens_inventario: ItemInventario[] })[]
  },

  // Criar novo inventário sempre usando loja_id do usuário
  async criar(inventario: Partial<Inventario>, lojaId: string) {
    const inventarioComLoja = { ...inventario, loja_id: lojaId }
    const { data, error } = await supabase
      .from("inventarios")
      .insert(inventarioComLoja)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Obter inventário por ID
  async obter(id: string) {
    const { data, error } = await supabase
      .from("inventarios")
      .select("*, itens_inventario(*)")
      .eq("id", id)
      .single()

    if (error) throw error
    return data as Inventario & { itens_inventario: ItemInventario[] }
  },

  // Atualizar inventário
  async atualizar(id: string, updates: Partial<Inventario>) {
    const { data, error } = await supabase
      .from("inventarios")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Excluir inventário
  async excluir(id: string) {
    const { error } = await supabase.from("inventarios").delete().eq("id", id)
    if (error) throw error
  },
}

// Serviço de produtos
export const produtoService = {
  // Listar produtos da loja atual
  async listar() {
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .order("nome")

    if (error) throw error
    return data as Produto[]
  },

  // Criar novo produto
  async criar(produto: Partial<Produto>) {
    const { data, error } = await supabase
      .from("produtos")
      .insert(produto)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Atualizar produto
  async atualizar(id: string, produto: Partial<Produto>) {
    const { data, error } = await supabase
      .from("produtos")
      .update(produto)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}

export const itemInventarioService = {
  // Adicionar item ao inventário
  async adicionar(item: Omit<ItemInventario, "id">) {
    const { data, error } = await supabase.from("itens_inventario").insert(item).select().single()

    if (error) {
      console.error("Erro ao adicionar item:", error)
      throw error
    }
    return data
  },

  // Listar itens de um inventário
  async listarPorInventario(inventarioId: string) {
    const { data, error } = await supabase
      .from("itens_inventario")
      .select("*")
      .eq("inventario_id", inventarioId)
      .order("data_contagem", { ascending: false })

    if (error) {
      console.error("Erro ao listar itens:", error)
      throw error
    }
    return data
  },

  // Atualizar item
  async atualizar(id: string, updates: Partial<ItemInventario>) {
    const { data, error } = await supabase.from("itens_inventario").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Erro ao atualizar item:", error)
      throw error
    }
    return data
  },

  // Excluir item
  async excluir(id: string) {
    const { error } = await supabase.from("itens_inventario").delete().eq("id", id)

    if (error) {
      console.error("Erro ao excluir item:", error)
      throw error
    }
  },
}

export const lojaService = {
  // Listar todas as lojas
  async listar() {
    const { data, error } = await supabase.from("lojas").select("*").eq("ativo", true).order("nome")

    if (error) {
      console.error("Erro ao listar lojas:", error)
      throw error
    }
    return data || []
  },

  // Obter loja por código
  async obterPorCodigo(codigo: string) {
    const { data, error } = await supabase.from("lojas").select("*").eq("codigo", codigo).single()

    if (error) {
      console.error("Erro ao obter loja:", error)
      throw error
    }
    return data
  },
}
