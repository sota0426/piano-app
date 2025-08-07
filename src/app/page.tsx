"use client";

import Link from "next/link";

export default function Home() {
  const quizzes = [
    {
      title: "ピアノ音階当てゲーム",
      description: "音階を当てるクイズ",
      path: "/scale_quiz",
      disabled: false,      
    },
    {
      title: "楽譜音符当てゲーム",
      description: "楽譜を読み取るクイズ",
      path: "/sheet_quiz",
      disabled: false,      
    },
    {
      title: "リズム当てゲーム",
      description: "リズムパターンを当てるクイズ",
      path: "/rhythm_quiz",
      disabled: true,      
    },  ]


  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">音楽アプリメニュー</h1>
        
        <div className="grid md:grid-cols-1 gap-6">
          {quizzes.map((quiz, index) => (
            <div
              key={index}
              className={`p-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 ${
                quiz.disabled ? "bg-gray-200 cursor-not-allowed opacity-60" : "bg-white"
              }`}
            >
              <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
              <p className="text-gray-600 mb-4">{quiz.description}</p>
              {!quiz.disabled && (
                <Link href={quiz.path}>
                  <span className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                    プレイする
                  </span>
                </Link>
              )}
              {quiz.disabled && <span className="text-sm text-gray-500">近日公開予定</span>}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
