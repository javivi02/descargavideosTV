import puppeteer from 'puppeteer'
import fs from 'fs/promises'

const filePath = 'enlaces.txt'
const fileContent = await fs.readFile(filePath, 'utf-8')
const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0)
const urls = lines.map(line => line.split(' ')[0])

async function obtenerEnlaces () {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  const results = []

  for (const url of urls) {
    try {
      console.log(`🔄 Procesando: ${url}`)
      await page.goto('https://www.descargavideos.tv/', { waitUntil: 'networkidle2' })

      // Introducir la URL y hacer clic en el botón
      await page.type('input[name="web"]', url)
      await page.click('#submitBtn')

      // Esperar a que aparezcan los enlaces de descarga
      await page.waitForSelector('#enlaces a.link', { timeout: 10000 })

      // Extraer todos los enlaces de descarga
      const enlaces = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('#enlaces a.link')).map(a => ({
          texto: a.textContent.trim(),
          enlace: a.href
        }))
      })

      results.push({
        original: url,
        descargas: enlaces.length ? enlaces : [{ error: 'No se encontraron enlaces' }]
      })

      console.log(`✅ Descargas obtenidas (${enlaces.length} enlaces).`)
    } catch (error) {
      console.error(`❌ Error con ${url}:`, error.message)
      results.push({ original: url, error: 'No se pudo obtener el enlace' })
    }
  }

  await browser.close()

  // Guardar como JSON todos los enlaces de descarga
  await fs.writeFile('resultados.json', JSON.stringify(results, null, 2))

  // Guardar en texto plano solo el primer enlace de descarga
  const textoPlano = results.map(r => {
    if (r.descargas && r.descargas.length > 0) {
      return `${r.descargas[0].enlace}`
    } else {
      return `${r.original} -> ${r.error}`
    }
  }).join('\n')
  await fs.writeFile('resultados.txt', textoPlano)

  console.log('\n📄 Enlaces de descarga guardados en `resultados.json` y `resultados.txt`.')
}

// Ejecutar la función
obtenerEnlaces()
