import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Produto, ProdutoRequest } from '../models/produtos';

@Injectable({
  providedIn: 'root',
})
export class ProdutoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrlProdutos = 'http://localhost:8080/api/produtos';

  listar(): Observable<Produto[]> {
    return this.http.get<Produto[]>(this.baseUrlProdutos);
  }

  cadastrar(produto: ProdutoRequest): Observable<Produto> {
    return this.http.post<Produto>(this.baseUrlProdutos, produto);
  }

  cadatrar(produto: ProdutoRequest): Observable<Produto> {
    return this.cadastrar(produto);
  }

  atualizar(id: number, produto: ProdutoRequest): Observable<Produto> {
    return this.http.put<Produto>(`${this.baseUrlProdutos}/${id}`, produto);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrlProdutos}/${id}`);
  }
}
