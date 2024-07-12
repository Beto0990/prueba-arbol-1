document.addEventListener('DOMContentLoaded', function () {
    // Cargar los datos desde los archivos JSON
    Promise.all([
        fetch('producto_categoria.json').then(response => response.json()),
        fetch('sintoma.json').then(response => response.json()),
        fetch('diagnostico_pregunta.json').then(response => response.json()),
        fetch('respuesta.json').then(response => response.json()),
        fetch('falla.json').then(response => response.json()),
        fetch('diagnostico.json').then(response => response.json())
    ]).then(data => {
        const [productoCategoria, sintoma, diagnosticoPregunta, respuesta, falla, diagnostico] = data;

        let history = [];
        let currentCategory = '';
        let questionAnswerHistory = [];

        // Mostrar la primera categoría de productos
        function mostrarCategorias() {
            history = [];
            currentCategory = '';
            questionAnswerHistory = [];
            document.getElementById('category-title').innerText = 'Árbol de Diagnóstico';
            toggleSection('categorias');
            const categoriasDiv = document.querySelector('#categorias .button-container');
            categoriasDiv.innerHTML = '';
            productoCategoria.forEach(categoria => {
                const button = document.createElement('button');
                button.innerText = categoria.Nombre;
                button.onclick = () => {
                    history.push('categorias');
                    currentCategory = categoria.Nombre;
                    document.getElementById('category-title').innerText = `Diagnóstico: ${currentCategory}`;
                    mostrarSintomas(categoria.CategoriaID);
                };
                categoriasDiv.appendChild(button);
            });
            document.getElementById('button-group').style.display = 'none';
        }

        // Mostrar los síntomas según la categoría seleccionada
        function mostrarSintomas(categoriaID) {
            toggleSection('sintomas');
            const sintomasDiv = document.querySelector('#sintomas .button-container');
            sintomasDiv.innerHTML = '';
            const sintomasFiltrados = sintoma.filter(s => s.CategoriaID === categoriaID);
            sintomasFiltrados.forEach(sint => {
                const button = document.createElement('button');
                button.innerText = sint.Nombre;
                button.onclick = () => {
                    history.push('sintomas');
                    mostrarPreguntaInicial(sint.SintomaID);
                };
                sintomasDiv.appendChild(button);
            });
        }

        // Mostrar la primera pregunta según el síntoma seleccionado
        function mostrarPreguntaInicial(sintomaID) {
            toggleSection('preguntas');
            const preguntaInicial = diagnosticoPregunta.find(dp => dp.SintomaID === sintomaID);
            mostrarPregunta(preguntaInicial);
        }

        // Mostrar una pregunta específica
        function mostrarPregunta(pregunta) {
            if (!pregunta) {
                alert('No hay más preguntas disponibles. Regresando al inicio.');
                mostrarCategorias();
                return;
            }
            history.push('preguntas');
            const preguntaTexto = document.getElementById('pregunta-texto');
            preguntaTexto.innerHTML = `<h3>${pregunta.Pregunta}</h3>`;
            const preguntasDiv = document.querySelector('#preguntas .button-container');
            preguntasDiv.innerHTML = '';
            const respuestasFiltradas = respuesta.filter(r => r.PreguntaID === pregunta.PreguntaID);
            respuestasFiltradas.forEach((resp, index) => {
                const button = document.createElement('button');
                button.innerText = resp.Respuesta;
                button.className = getButtonClass(index);
                button.onclick = () => manejarRespuesta(resp, pregunta.Pregunta);
                preguntasDiv.appendChild(button);
            });
        }

        // Obtener la clase del botón basada en el índice
        function getButtonClass(index) {
            const classes = ['primary', 'secondary', 'warning', 'danger'];
            return classes[index % classes.length];
        }

        // Manejar la respuesta del usuario
        function manejarRespuesta(respuestaSeleccionada, preguntaTexto) {
            questionAnswerHistory.push({ pregunta: preguntaTexto, respuesta: respuestaSeleccionada.Respuesta });
            if (respuestaSeleccionada.SiguientePreguntaID) {
                const siguientePregunta = diagnosticoPregunta.find(dp => dp.PreguntaID === respuestaSeleccionada.SiguientePreguntaID);
                mostrarPregunta(siguientePregunta);
            } else if (respuestaSeleccionada.FallaID) {
                mostrarDiagnostico(respuestaSeleccionada.FallaID);
            } else {
                alert('Diagnóstico completo. No hay más preguntas ni fallas asociadas.');
            }
        }

        // Mostrar el diagnóstico final
        function mostrarDiagnostico(fallaID) {
            toggleSection('diagnostico');
            const fallaSeleccionada = falla.find(f => f.FallaID === fallaID);
            const diagnosticosFiltrados = diagnostico.filter(d => d.FallaID === fallaID);
            const diagnosticoDiv = document.getElementById('diagnostico');
            diagnosticoDiv.innerHTML = `<h3>Falla: ${fallaSeleccionada.Descripcion}</h3>`;
            diagnosticosFiltrados.forEach(d => {
                const p = document.createElement('p');
                p.innerText = d.Descripcion;
                diagnosticoDiv.appendChild(p);
            });
            document.getElementById('button-group').style.display = 'flex';
        }

        // Toggle sections visibility
        function toggleSection(sectionId) {
            document.getElementById('categorias').style.display = 'none';
            document.getElementById('sintomas').style.display = 'none';
            document.getElementById('preguntas').style.display = 'none';
            document.getElementById('diagnostico').style.display = 'none';
            document.getElementById(sectionId).style.display = 'block';
            if (sectionId === 'categorias') {
                document.getElementById('button-group').style.display = 'none';
            }
            document.getElementById('back-button').style.display = history.length > 0 ? 'block' : 'none';
        }

        // Back button functionality
        document.getElementById('back-button').onclick = function() {
            const lastSection = history.pop();
            if (lastSection) {
                toggleSection(lastSection);
                questionAnswerHistory.pop();
            }
            if (history.length === 0) {
                document.getElementById('button-group').style.display = 'none';
            }
        }

        // Inicio button functionality
        document.getElementById('inicio-button').onclick = function() {
            const confirmacion = confirm("Si no ha guardado el PDF, la información se perderá. ¿Desea continuar?");
            if (confirmacion) {
                mostrarCategorias();
                document.getElementById('button-group').style.display = 'none';
            }
        }

        // PDF button functionality
        document.getElementById('pdf-button').onclick = function() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const margin = 10;
            const pageWidth = doc.internal.pageSize.getWidth();
            const textWidth = pageWidth - margin * 2;
            let yPosition = 20;

            doc.setFontSize(18);
            doc.text("Árbol de Diagnóstico", margin, yPosition);
            yPosition += 10;

            doc.setFontSize(14);
            doc.text(`Categoría: ${currentCategory}`, margin, yPosition);
            yPosition += 10;

            doc.setFontSize(12);
            questionAnswerHistory.forEach(qa => {
                const preguntaText = doc.splitTextToSize(`Pregunta: ${qa.pregunta}`, textWidth);
                doc.text(preguntaText, margin, yPosition);
                yPosition += preguntaText.length * 10;

                const respuestaText = doc.splitTextToSize(`Respuesta: ${qa.respuesta}`, textWidth);
                doc.text(respuestaText, margin, yPosition);
                yPosition += respuestaText.length * 10 + 5;

                doc.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 5;
            });

            const diagnosticoText = document.querySelector('#diagnostico').innerText;
            const diagnosticoTextLines = doc.splitTextToSize(`Diagnóstico: ${diagnosticoText}`, textWidth);
            doc.text(diagnosticoTextLines, margin, yPosition);
            yPosition += diagnosticoTextLines.length * 10;

            doc.save("diagnostico.pdf");
        }

        // Inicializar la interfaz mostrando las categorías
        mostrarCategorias();
    }).catch(error => {
        console.error('Error al cargar los datos:', error);
    });
});
