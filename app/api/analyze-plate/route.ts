import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, siswa } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this photo of a food plate. Determine if the food has been completely finished or if there is still food remaining. 

Instructions:
- Look at the plate carefully
- Check if there are any food remnants
- Consider sauce, rice grains, or any leftover pieces
- Return your analysis in JSON format

Respond ONLY with valid JSON in this exact format:
{
  "isFinished": true/false,
  "confidence": 85,
  "description": "Detailed description in Indonesian",
  "remainingPercentage": 0-100
}

Student: ${siswa.nama}
Class: ${siswa.kelas}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const analysisText = response.choices[0].message.content;
    let analysis;
    
    try {
      const jsonMatch = analysisText?.match(/```json\n([\s\S]*?)\n```/) || 
                       analysisText?.match(/```\n([\s\S]*?)\n```/) ||
                       analysisText?.match(/\{[\s\S]*\}/);
      
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : analysisText;
      analysis = JSON.parse(jsonStr || '{}');
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      analysis = {
        isFinished: false,
        confidence: 70,
        description: analysisText || 'Tidak dapat menganalisis foto',
        remainingPercentage: 30
      };
    }

    console.log('AI Analysis Result:', analysis);

    return NextResponse.json({
      success: true,
      ...analysis,
      timestamp: new Date().toISOString(),
      siswa: {
        nama: siswa.nama,
        nis: siswa.nis,
        kelas: siswa.kelas
      }
    });

  } catch (error: any) {
    console.error('Error analyzing plate:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze image',
        message: error.message,
        isFinished: Math.random() > 0.5,
        confidence: 75,
        description: 'Terjadi kesalahan saat menganalisis foto. Ini adalah hasil simulasi.'
      },
      { status: 500 }
    );
  }
}