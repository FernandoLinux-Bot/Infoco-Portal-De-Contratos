import { createClient } from '@supabase/supabase-js';
import { put, del } from '@vercel/blob';

// O Vercel injeta automaticamente estas variáveis de ambiente
// a partir das integrações do Supabase e do Blob.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Helper para criar respostas JSON
const jsonResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
     },
  });
};

// Optamos pelo Edge Runtime da Vercel para melhor performance
export const runtime = 'edge';

/**
 * GET /api/contracts
 * Lista todos os arquivos de contrato do banco de dados.
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    return jsonResponse(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: 'Falha ao buscar arquivos', details: message }, 500);
  }
}

/**
 * POST /api/contracts?filename=your-file.zip
 * Faz o upload de um novo arquivo para o Vercel Blob e salva seus metadados no Supabase.
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return jsonResponse({ error: 'Nome do arquivo e corpo da requisição são obrigatórios', details: 'Missing filename or request body.' }, 400);
  }

  try {
    // 1. Envia o arquivo para o Vercel Blob
    // A função 'put' lida com o stream do corpo da requisição.
    const blob = await put(filename, request.body, {
      access: 'public',
    });

    // 2. Prepara os dados para salvar no Supabase. A `PutBlobResult` do Vercel Blob
    // não tem mais a propriedade `size`, então usamos o header `content-length`.
    const fileDataToInsert = {
      name: filename,
      // FIX: Property 'size' does not exist on type 'PutBlobResult'. Using the 'content-length' header instead.
      size: parseInt(request.headers.get('content-length') || '0', 10),
      url: blob.url,
    };

    // 3. Salva os metadados no Supabase
    const { data: newContract, error: dbError } = await supabase
      .from('contracts')
      .insert(fileDataToInsert)
      .select()
      .single();

    if (dbError) {
      // Se a inserção no banco falhar, deleta o blob órfão para manter a consistência
      await del(blob.url);
      throw dbError; // Lança o erro para ser capturado pelo catch
    }

    return jsonResponse(newContract, 201); // 201 Created

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Falha no upload:', error);
    return jsonResponse({ error: 'Falha ao fazer upload do arquivo', details: message }, 500);
  }
}


/**
 * DELETE /api/contracts
 * Exclui um arquivo do Vercel Blob e seu registro correspondente do Supabase.
 * Espera um corpo JSON com { id, url }.
 */
export async function DELETE(request: Request) {
  try {
    const { id, url } = await request.json();

    if (!id || !url) {
      return jsonResponse({ error: 'ID e URL do arquivo são obrigatórios' }, 400);
    }

    // 1. Exclui o arquivo do Vercel Blob
    await del(url);

    // 2. Exclui o registro do Supabase
    const { error: dbError } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    return jsonResponse({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: 'Falha ao excluir o arquivo', details: message }, 500);
  }
}
