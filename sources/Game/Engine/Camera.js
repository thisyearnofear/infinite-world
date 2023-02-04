import Registry from '@/Registry.js' 
import Game from '@/Game.js'
import Engine from '@/Engine/Engine.js'

import { vec3, quat2 } from 'gl-matrix'

class Camera
{
    constructor(player)
    {
        this.game = Game.getInstance()
        this.engine = Engine.getInstance()
        this.controls = this.engine.controls
        this.debug = this.game.debug

        this.player = player

        this.position = vec3.create()
        this.quaternion = quat2.create()
        this.mode = Camera.MODE_THIRDPERSON

        this.thirdPerson = new Registry.Engine.CameraThirdPerson(this.player)
        this.fly = new Registry.Engine.CameraFly(this.player)
        
        // Activate
        if(this.mode === Camera.MODE_THIRDPERSON)
            this.thirdPerson.activate()
        
        else if(this.mode === Camera.MODE_FLY)
            this.fly.activate()

        this.controls.on('cameraModeDown', () =>
        {
            if(this.mode === Camera.MODE_THIRDPERSON)
            {
                this.mode = Camera.MODE_FLY
                this.fly.activate(this.position, this.quaternion)
                this.thirdPerson.deactivate()
            }
            
            else if(this.mode === Camera.MODE_FLY)
            {
                this.mode = Camera.MODE_THIRDPERSON
                this.fly.deactivate()
                this.thirdPerson.activate()
            }
        })

        this.setDebug()
    }

    update()
    {
        this.thirdPerson.update()
        this.fly.update()

        if(this.mode === Camera.MODE_THIRDPERSON)
        {
            vec3.copy(this.position, this.thirdPerson.position)
            quat2.copy(this.quaternion, this.thirdPerson.quaternion)
        }

        else if(this.mode === Camera.MODE_FLY)
        {
            vec3.copy(this.position, this.fly.position)
            quat2.copy(this.quaternion, this.fly.quaternion)
        }
    }

    setDebug()
    {
        const debug = this.game.debug

        if(!debug.active)
            return

        const folder = debug.ui.getFolder('engine/player/view')

        folder
            .add(
                this,
                'mode',
                {
                    'MODE_THIRDPERSON': Camera.MODE_THIRDPERSON,
                    'MODE_FLY': Camera.MODE_FLY
                }
            )
            .onChange(() =>
            {
                if(this.mode === Camera.MODE_THIRDPERSON)
                {
                    this.fly.deactivate()
                    this.thirdPerson.activate()
                }
                
                else if(this.mode === Camera.MODE_FLY)
                {
                    this.fly.activate(this.position, this.quaternion)
                    this.thirdPerson.deactivate()
                }
            })
    }
}

Camera.MODE_THIRDPERSON = 1
Camera.MODE_FLY = 2

Registry.register('Engine', 'Camera', Camera)
export default Camera