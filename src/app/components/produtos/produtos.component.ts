import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, timer } from 'rxjs';
import { Categoria, Produto, ProdutoRequest } from '../../models/produtos';
import { CategoriaService } from '../../services/categoria.service';
import { ProdutoService } from '../../services/produto.service';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './produtos.component.html',
  styleUrl: './produtos.component.css',
})
export class ProdutosComponent implements OnInit {
  private readonly produtoService = inject(ProdutoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly intervaloAtualizacaoMs = 5000;

  produtos: Produto[] = [];
  categorias: Categoria[] = [];
  produtoEditandoId: number | null = null;
  mensagem = '';
  erro = '';

  formulario = this.formBuilder.nonNullable.group({
    nome: ['', Validators.required],
    descricao: [''],
    preco: [0.01, [Validators.required, Validators.min(0)]],
    quantidade: [0, [Validators.required, Validators.min(0)]],
    categoriaId: [0, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.atualizarProdutosPeriodicamente();
    this.carregarCategorias();
  }

  private atualizarProdutosPeriodicamente(): void {
    timer(0, this.intervaloAtualizacaoMs)
      .pipe(
        switchMap(() =>
          this.produtoService.listar().pipe(
            catchError((erro: HttpErrorResponse) => {
              this.erro = `Não foi possível carregar os produtos (HTTP ${erro.status}).`;
              this.changeDetector.markForCheck();
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((produtos) => {
        this.produtos = produtos;
        this.changeDetector.markForCheck();
      });
  }

  carregarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.changeDetector.markForCheck();
      },
      error: (erro: HttpErrorResponse) => {
        this.erro = `Não foi possível carregar as categorias (HTTP ${erro.status}).`;
        this.changeDetector.markForCheck();
      },
    });
  }

  carregarProdutos(): void {
    this.produtoService.listar().subscribe({
      next: (produtos) => {
        this.produtos = produtos;
        this.changeDetector.markForCheck();
      },
      error: (erro: HttpErrorResponse) => {
        this.erro = `Não foi possível carregar os produtos (HTTP ${erro.status}).`;
        this.changeDetector.markForCheck();
      },
    });
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const request: ProdutoRequest = this.formulario.getRawValue();
    const operacao =
      this.produtoEditandoId === null
        ? this.produtoService.cadastrar(request)
        : this.produtoService.atualizar(this.produtoEditandoId, request);

    operacao.subscribe({
      next: () => {
        this.mensagem =
          this.produtoEditandoId === null
            ? 'Produto cadastrado com sucesso.'
            : 'Produto atualizado com sucesso.';
        this.produtoEditandoId = null;
        this.formulario.reset({
          nome: '',
          descricao: '',
          preco: 0.01,
          quantidade: 0,
          categoriaId: 0,
        });
        this.changeDetector.markForCheck();
        this.carregarProdutos();
      },
      error: (erro: HttpErrorResponse) => {
        this.erro = `Não foi possível salvar o produto (HTTP ${erro.status}).`;
        this.changeDetector.markForCheck();
      },
    });
  }

  editar(produto: Produto): void {
    this.produtoEditandoId = produto.id;

    this.formulario.setValue({
      nome: produto.nome,
      descricao: produto.descricao ?? '',
      preco: produto.preco,
      quantidade: produto.quantidade,
      categoriaId: produto.categoria?.id ?? 0,
    });
  }

  excluir(produto: Produto): void {
    const confirmou = confirm(`Deseja excluir o produto ${produto.nome}?`);

    if (!confirmou) {
      return;
    }

    this.produtoService.excluir(produto.id).subscribe({
      next: () => {
        this.mensagem = 'Produto excluído com sucesso.';
        this.changeDetector.markForCheck();
        this.carregarProdutos();
      },
      error: (erro: HttpErrorResponse) => {
        this.erro = `Não foi possível excluir o produto (HTTP ${erro.status}).`;
        this.changeDetector.markForCheck();
      },
    });
  }

  cancelarEdicao(): void {
    this.produtoEditandoId = null;
    this.formulario.reset({
      nome: '',
      descricao: '',
      preco: 0.01,
      quantidade: 0,
      categoriaId: 0,
    });
  }
}
