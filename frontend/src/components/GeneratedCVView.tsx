import React, { useState } from 'react';
import type { GeneratedCVData } from '../types';
import {
  Printer,
  Copy,
  Download,
  Check,
  Sparkles,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  Code,
  Mail,
  Phone,
  Globe,
  Share2,
  MapPin
} from 'lucide-react';

interface GeneratedCVViewProps {
  cvData: GeneratedCVData;
  targetJob: string;
}

export const GeneratedCVView: React.FC<GeneratedCVViewProps> = ({ cvData, targetJob }) => {
  const [copied, setCopied] = useState(false);
  const [templateStyle, setTemplateStyle] = useState<'modern' | 'classic'>('modern');

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    const markdown = `# ${cvData.full_name}
**${cvData.target_title || targetJob}**
Email: ${cvData.contact.email} | SĐT: ${cvData.contact.phone} | GitHub: ${cvData.contact.github || ''} | LinkedIn: ${cvData.contact.linkedin || ''}

## Tóm Tắt Năng Lực
${cvData.summary}

## Kỹ Năng Chuyên Môn
${Object.entries(cvData.technical_skills || {})
  .map(([cat, skills]) => `- **${cat}**: ${skills.join(', ')}`)
  .join('\n')}

## Kinh Nghiệm Thực Tế & Thực Tập
${(cvData.experience || [])
  .map(
    (exp) => `### ${exp.position} - ${exp.company} (${exp.duration})
${exp.achievements.map((a) => `- ${a}`).join('\n')}`
  )
  .join('\n\n')}

## Dự Án Tiêu Biểu
${(cvData.projects || [])
  .map(
    (proj) => `### ${proj.name} (${proj.role})
Công nghệ: ${proj.tech_stack.join(', ')}
${proj.highlights.map((h) => `- ${h}`).join('\n')}`
  )
  .join('\n\n')}

## Học Vấn & Chứng Chỉ
${(cvData.education || [])
  .map(
    (edu) => `- **${edu.degree}** - ${edu.institution} (${edu.duration}) | GPA: ${edu.gpa || 'N/A'}`
  )
  .join('\n')}

### Chứng Chỉ
${(cvData.certifications || []).map((c) => `- ${c}`).join('\n')}
`;

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const textContent = `${cvData.full_name}\n${cvData.target_title}\nEmail: ${cvData.contact.email} | Phone: ${cvData.contact.phone}\n\nSUMMARY:\n${cvData.summary}\n\nSKILLS:\n` +
      Object.entries(cvData.technical_skills || {}).map(([k, v]) => `${k}: ${v.join(', ')}`).join('\n') +
      `\n\nEXPERIENCE:\n` +
      (cvData.experience || []).map(e => `${e.position} at ${e.company} (${e.duration})\n` + e.achievements.map(a => `• ${a}`).join('\n')).join('\n\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CV_${cvData.full_name.replace(/\s+/g, '_')}_ATS.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Control Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm no-print">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              CV Đã Bổ Sung Kỹ Năng Thiếu (Chuẩn ATS Tuyển Dụng)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Được AI biên soạn lại với các kỹ năng và từ khóa trọng tâm cho vị trí <span className="font-semibold text-emerald-600 dark:text-emerald-400">{targetJob}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Template Style Toggle */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTemplateStyle('modern')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                templateStyle === 'modern'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Giao diện Hiện Đại
            </button>
            <button
              onClick={() => setTemplateStyle('classic')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                templateStyle === 'classic'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Classic ATS Thuần
            </button>
          </div>

          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Sao chép toàn bộ nội dung dạng Markdown"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Đã chép!' : 'Chép Markdown'}
          </button>

          <button
            onClick={handleDownloadTxt}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Tải tệp văn bản .txt"
          >
            <Download className="w-4 h-4" />
            Tải .txt
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all"
            title="In hoặc Lưu thành PDF"
          >
            <Printer className="w-4 h-4" />
            In / Xuất PDF
          </button>
        </div>
      </div>

      {/* AI Improvements Alert Banner */}
      {cvData.ai_enhancement_notes && cvData.ai_enhancement_notes.length > 0 && (
        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 rounded-2xl no-print">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Các cải tiến trọng điểm đã được AI tích hợp vào bản CV này:
              </h4>
              <ul className="text-xs text-slate-700 dark:text-slate-300 list-disc list-inside space-y-0.5">
                {cvData.ai_enhancement_notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CV Paper Preview */}
      <div
        className={`cv-print-container mx-auto max-w-4xl bg-white text-slate-900 shadow-xl rounded-2xl border border-slate-200 transition-all duration-200 ${
          templateStyle === 'modern' ? 'p-8 sm:p-12' : 'p-8 sm:p-10 font-serif'
        }`}
      >
        {/* CV Header */}
        <div className={`border-b pb-6 ${templateStyle === 'modern' ? 'border-slate-200' : 'border-slate-800'}`}>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 uppercase">
            {cvData.full_name}
          </h1>
          <p className="text-base sm:text-lg font-bold text-emerald-600 mt-1">
            {cvData.target_title || targetJob}
          </p>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-xs sm:text-sm text-slate-600">
            {cvData.contact.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {cvData.contact.email}
              </span>
            )}
            {cvData.contact.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {cvData.contact.phone}
              </span>
            )}
            {cvData.contact.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {cvData.contact.location}
              </span>
            )}
            {cvData.contact.github && (
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                {cvData.contact.github}
              </span>
            )}
            {cvData.contact.linkedin && (
              <span className="flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                {cvData.contact.linkedin}
              </span>
            )}
          </div>
        </div>

        {/* Professional Summary */}
        <div className="pt-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2.5 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            Tóm Tắt Năng Lực Chuyên Môn
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed text-justify">
            {cvData.summary}
          </p>
        </div>

        {/* Core Competencies */}
        {cvData.core_competencies && cvData.core_competencies.length > 0 && (
          <div className="pt-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2.5 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              Thế Mạnh Nổi Bật (Core Competencies)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700">
              {cvData.core_competencies.map((comp, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{comp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Skills */}
        <div className="pt-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3 flex items-center gap-1.5">
            <Code className="w-4 h-4 text-emerald-600" />
            Kỹ Năng Kỹ Thuật & Công Cụ AI
          </h2>
          <div className="space-y-2 text-xs sm:text-sm">
            {Object.entries(cvData.technical_skills || {}).map(([category, skills]) => (
              <div key={category} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                <span className="font-bold text-slate-900 min-w-[200px] shrink-0">
                  {category}:
                </span>
                <span className="text-slate-700">
                  {skills.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Work / Internship Experience */}
        {cvData.experience && cvData.experience.length > 0 && (
          <div className="pt-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              Kinh Nghiệm Thực Chiến & Thực Tập
            </h2>
            <div className="space-y-4">
              {cvData.experience.map((exp, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-slate-900">{exp.position}</span>
                    <span className="text-slate-500 font-medium">{exp.duration}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold text-emerald-700">{exp.company}</span>
                    <span>{exp.location}</span>
                  </div>
                  <ul className="list-disc list-outside ml-4 text-xs sm:text-sm text-slate-700 space-y-1 pt-1">
                    {exp.achievements.map((ach, aIdx) => (
                      <li key={aIdx}>{ach}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {cvData.projects && cvData.projects.length > 0 && (
          <div className="pt-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              Dự Án Điển Hình (Portfolio Projects)
            </h2>
            <div className="space-y-4">
              {cvData.projects.map((proj, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-slate-900">{proj.name}</span>
                    <span className="text-slate-500 font-medium">{proj.role}</span>
                  </div>
                  <div className="text-xs text-emerald-700 font-medium">
                    Công nghệ: {proj.tech_stack.join(', ')}
                  </div>
                  <ul className="list-disc list-outside ml-4 text-xs sm:text-sm text-slate-700 space-y-1 pt-1">
                    {proj.highlights.map((hl, hIdx) => (
                      <li key={hIdx}>{hl}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {cvData.education && cvData.education.length > 0 && (
          <div className="pt-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2.5 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              Học Vấn
            </h2>
            <div className="space-y-2">
              {cvData.education.map((edu, idx) => (
                <div key={idx} className="text-xs sm:text-sm">
                  <div className="flex flex-wrap items-center justify-between">
                    <span className="font-bold text-slate-900">{edu.institution}</span>
                    <span className="text-slate-500">{edu.duration}</span>
                  </div>
                  <div className="text-slate-700 font-medium">
                    {edu.degree} {edu.gpa && `• GPA: ${edu.gpa}`}
                  </div>
                  {edu.honors && (
                    <div className="text-xs text-slate-600 mt-0.5 italic">
                      {edu.honors}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {cvData.certifications && cvData.certifications.length > 0 && (
          <div className="pt-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              Chứng Chỉ Chuyên Môn
            </h2>
            <ul className="list-disc list-outside ml-4 text-xs sm:text-sm text-slate-700 space-y-0.5">
              {cvData.certifications.map((cert, idx) => (
                <li key={idx}>{cert}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
