let icon = '<circle cx="12" cy="12" r="9" fill="none" fill-rule="evenodd" stroke="currentColor" stroke-width="2"/>'

miro.onReady(() => {
  miro.initialize({
    extensionPoints: {
      bottomBar: {
        title: 'Hi',
        svgIcon: icon,
        onClick: async () => {
          debugger
          let allImages = await miro.board.widgets.get({type: 'image'})
          let allLines = await miro.board.widgets.get({type: 'line'})
          allLines.forEach(s => {
            s.clientVisible = false
          })
          await miro.board.widgets.update(allLines)

          let solarObjects = await createSolarSystem(allImages, allLines)

          const radi = Object.values(solarObjects).map(solarObject => solarObject.radius || 0)

          const max_radius = Math.max(...radi)
        
          const waitOneSec = () => new Promise(r => setTimeout(r, 10))

          
          let i = 0
          while (i < 60){
          //while (true){

            
            await waitOneSec()
            Object.values(solarObjects).map(solarObject => {
              if (!solarObject.orbit){
                return
              }
              
              const speed = max_radius/solarObject.radius*.1
  
              let x_orbit = solarObjects[solarObject.orbit].static ? solarObjects[solarObject.orbit].x : solarObjects[solarObject.orbit].current_x
              let y_orbit = solarObjects[solarObject.orbit].static ? solarObjects[solarObject.orbit].y : solarObjects[solarObject.orbit].current_y
  
              
  
  
              const coord = orbit(x_orbit, y_orbit, solarObject.radius, solarObject.current_angle + speed)
              x = coord[0]
              y = coord[1]
              //await waitOneSec()
              //miro.board.widgets.transformDelta(allImages[1].id, /10, y/10)
              miro.board.widgets.update({id: solarObject.id, x: x, y: y})
              solarObjects[solarObject.id]['current_x'] = x
              solarObjects[solarObject.id]['current_y'] = y
              solarObjects[solarObject.id]['current_angle'] = solarObject.current_angle + speed
              i=i+1
            })
            
          }
          let allShapes = await miro.board.widgets.get({type: 'shape'})
          await miro.board.widgets.deleteById(allShapes.map(shape => shape.id))
          allLines.forEach(s => {
            s.clientVisible = true
          })
          miro.board.widgets.update(allLines)
        },
      },
    },
  })
})

async function getDynamicPosition(id){
  const orbit = await miro.board.widgets.get({id : id})
  const x_orbit = orbit[0].x
  const y_orbit = orbit[0].y
  return [x_orbit, y_orbit]
}

async function createSolarSystem(images, lines){
  let solarObjects = {}
  images.map(image => solarObjects[image.id] = {id: image.id, static: true, x:image.x, y:image.y, current_x:image.x, current_y:image.y, radius: 0})
  lines.map(async (line) => {
    solarObjects[line.startWidgetId]['orbit'] = line.endWidgetId
    solarObjects[line.startWidgetId]['static'] = false

    let x_satellite = solarObjects[line.startWidgetId]['x']
    let y_satellite = solarObjects[line.startWidgetId]['y']

    let x_orbit = solarObjects[line.endWidgetId]['x']
    let y_orbit = solarObjects[line.endWidgetId]['y']
  
    let delta_x = x_satellite-x_orbit
    let delta_y = y_satellite-y_orbit

    let radius = Math.hypot(delta_x, delta_y)

    solarObjects[line.startWidgetId]['current_angle'] = Math.atan2(delta_y, delta_x) 
    solarObjects[line.startWidgetId]['radius'] = radius
    solarObjects[line.startWidgetId]['speed'] = (2*Math.PI*500)/radius
    const orbitPerimeter = await miro.board.widgets.create({type: 'shape', x: x_orbit, y: y_orbit, width: 2*radius, height: 2*radius, style: {shapeType: 4}})

    if (!solarObjects[line.endWidgetId]['static']){
      solarObjects[orbitPerimeter[0].id] = Object.assign({}, solarObjects[line.endWidgetId])
      solarObjects[orbitPerimeter[0].id].id = orbitPerimeter[0].id
    } 
  })
  return solarObjects
}

function orbit(x_centre, y_centre, radius, angle_rad){
  //const angle_rad = angle_deg * (Math.PI / 180);
  const x_next = x_centre + radius*Math.cos(angle_rad)
  const y_next = y_centre + radius*Math.sin(angle_rad)
  return ([x_next, y_next])
}