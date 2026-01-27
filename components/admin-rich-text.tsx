"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface AdminRichTextProps {
  value: string;
  onChange: (html: string) => void;
}

export default function AdminRichText({ value, onChange }: AdminRichTextProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sincronizar contenido externo -> editor
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string, value?: string) => {
    // Foco al editor antes de ejecutar
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    // Notificar cambio
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const toggleBlock = (block: "P" | "H2" | "H3") => exec("formatBlock", block);

  const onInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // Pegar como HTML limpio básico (permitimos el propio contenteditable formatear)
    // Para simplificar, pegamos texto plano y dejamos que el usuario formatee.
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => exec("bold")}
        >
          B
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => exec("italic")}
        >
          <em>I</em>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => exec("underline")}
        >
          <u>U</u>
        </Button>
        <span className="w-px h-6 bg-gray-200" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => toggleBlock("P")}
        >
          P
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => toggleBlock("H2")}
        >
          H2
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => toggleBlock("H3")}
        >
          H3
        </Button>
        <span className="w-px h-6 bg-gray-200" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => exec("insertUnorderedList")}
        >
          • Lista
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => exec("insertOrderedList")}
        >
          1. Lista
        </Button>
        <span className="w-px h-6 bg-gray-200" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const url = prompt("Insertar enlace (URL)");
            if (url) exec("createLink", url);
          }}
        >
          Link
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => exec("unlink")}
        >
          Quitar link
        </Button>
        <span className="w-px h-6 bg-gray-200" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => exec("removeFormat")}
        >
          Limpiar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => exec("undo")}
        >
          ↶
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => exec("redo")}
        >
          ↷
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={onInput}
        onBlur={onInput}
        onPaste={onPaste}
        className="font-neutra text-[15px] leading-[22px] min-h-[140px] p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        style={{ whiteSpace: "pre-wrap" }}
        suppressContentEditableWarning
        aria-label="Editor de texto enriquecido"
      />

      <div className="text-[11px] text-gray-500">
        Escribe como en Word: selecciona texto y usa la barra para negrita,
        cursiva, títulos, listas y enlaces.
      </div>
    </div>
  );
}
